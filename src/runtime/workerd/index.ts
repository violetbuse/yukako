import path from 'node:path';
import { spawn, ChildProcess } from 'node:child_process';
import { build_config, Config, serialize_config } from '@/runtime/config';
import { once } from 'node:events';
import { Readable } from 'node:stream';
import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { ConfigManager } from '@/runtime/config/manager';
import http from 'node:http';
import { rm } from 'node:fs/promises';

export const getWorkerdBinary = (): string => {
    const platform = process.platform === 'win32' ? 'windows' : process.platform;
    const arch = process.arch === 'arm64' ? 'arm64' : '64';

    const allowed_platforms = ['darwin', 'linux', 'windows'];
    const allowed_archs = ['64', 'arm64'];

    if (!allowed_platforms.includes(platform)) {
        throw new Error(`Unsupported platform: ${platform}`);
    }

    if (!allowed_archs.includes(arch)) {
        throw new Error(`Unsupported architecture: ${arch}`);
    }

    if (platform === 'windows' && arch === 'arm64') {
        throw new Error('Unsupported architecture: arm64 on Windows');
    }

    const binary = path.join(__dirname, 'workerd', `workerd-${platform}-${arch}`);

    return binary;
}

const wait_for_exit = (child: ChildProcess): Promise<void> => {
    return new Promise((resolve) => {
        child.once('exit', () => {
            // console.log("Child process exited");
            resolve();
        });
    });
}

const wait_for_startup = async (socket_path: string, timeout: number = 1000): Promise<void> => {
    // wait for the server to start, polling every 100ms
    const start_time = Date.now();
    while (true) {
        try {
            const options: http.RequestOptions = {
                socketPath: socket_path,
                path: "/__yukako/router-startup-check",
                hostname: "localhost",
                method: "GET"
            }

            const request = new Promise<void>((resolve, reject) => {
                const req = http.request(options, res => {
                    if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
                        reject(new Error("Workerd failed to start"));
                    }

                    if (res.statusCode === 200) {
                        resolve();
                    }
                })

                req.on("error", (error) => {
                    reject(error);
                })

                req.end();
            })

            await request;
            return;
        } catch (error) {
            if (Date.now() - start_time > timeout) {
                throw new Error("Workerd failed to start");
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}

const handle_output = (stdout: Readable, stderr: Readable) => {
    stdout.on("data", (data) => {
        console.log(`[workerd][stdout] ${data.toString()}`);
    })
    stderr.on("data", (data) => {
        console.error(`[workerd][stderr] ${data.toString()}`);
    })
}

export class WorkerdInstance {
    private static instance: WorkerdInstance;

    private binary_path: string;
    private binary_ready?: Promise<void>;
    private should_cleanup_binary: boolean = false;
    private child: ChildProcess | null;
    private exit_promise?: Promise<void>;
    private cleanupInProgress: boolean = false;

    private constructor() {
        this.binary_path = getWorkerdBinary();

        // if we're running in a package, we need to copy the binary to a temporary file
        // and make it executable
        // this is because pkg doesn't support executing the binary directly
        // @ts-ignore
        if (process.pkg) {
            const file = fs.createWriteStream('.workerdbin');
            this.should_cleanup_binary = true;
            this.binary_ready = pipeline(fs.createReadStream(this.binary_path), file).then(() => {
                fs.chmodSync('.workerdbin', 0o755);
            });

            this.binary_path = './.workerdbin';
        }

        this.child = null;

        // Add cleanup handlers for process termination
        process.on('SIGINT', () => this.handleSignal('SIGINT'));
        process.on('SIGTERM', () => this.handleSignal('SIGTERM'));
    }

    public static getInstance(): WorkerdInstance {
        if (!WorkerdInstance.instance) {
            WorkerdInstance.instance = new WorkerdInstance();
        }
        return WorkerdInstance.instance;
    }

    private async handleSignal(signal: string): Promise<void> {
        if (this.cleanupInProgress) return;
        this.cleanupInProgress = true;

        console.log(`Received ${signal}, cleaning up...`);
        try {
            await this.cleanup();
            if (this.should_cleanup_binary) {
                fs.rmSync(this.binary_path);
            }
            process.exit(0);
        } catch (error) {
            console.error('Error during cleanup:', error);
            process.exit(1);
        }
    }

    private async cleanup(): Promise<void> {
        if (this.child) {
            console.log("Cleaning up workerd instance");
            await this.dispose();
        }
    }

    public async reload_config(): Promise<void> {
        if (this.binary_ready) {
            await this.binary_ready;
        }

        const config = ConfigManager.getInstance().get_config();

        const workerd_config = await build_config(config);
        const config_binary = serialize_config(workerd_config);

        await this.dispose();

        if (fs.existsSync(config.workerd_socket)) {
            await rm(config.workerd_socket, { force: true });
        }

        const child_process = spawn(this.binary_path, ['serve', '--binary', '-'], {
            stdio: ['pipe', 'pipe', 'pipe', 'pipe'],
            env: { ...process.env }
        });

        handle_output(child_process.stdout, child_process.stderr);
        this.child = child_process;
        this.exit_promise = wait_for_exit(child_process);

        if (child_process.stdin) {
            child_process.stdin.write(config_binary);
            child_process.stdin.end();
            await once(child_process.stdin, "finish");
        }

        await wait_for_startup(config.workerd_socket);
        // console.log("started workerd instance with config", JSON.stringify(workerd_config, null, 2));
        // console.log("started workerd instance");
    }

    public async dispose(): Promise<void> {
        if (this.child) {
            // console.log("Sending SIGTERM to child process...");
            this.child.kill("SIGTERM");

            // Wait for a short time to see if SIGTERM works
            const timeout = new Promise(resolve => setTimeout(resolve, 1000));
            const exitPromise = this.exit_promise;

            try {
                await Promise.race([exitPromise, timeout]);
            } catch (error) {
                console.error("Error waiting for process exit:", error);
            }

            // If process is still running, force kill it
            if (this.child.exitCode === null) {
                console.log("SIGTERM timed out, process still running. Sending SIGKILL...");
                this.child.kill("SIGKILL");
                await this.exit_promise;
            }

            this.child = null;
        }
    }

    public async kill(): Promise<void> {
        if (this.child) {
            console.log("Sending SIGKILL to child process...");
            this.child.kill("SIGKILL");
            await this.exit_promise;
            this.child = null;
        }
    }
}


