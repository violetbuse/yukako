import appRootPath from 'app-root-path';
import path from 'node:path';
import { spawn, ChildProcess } from 'node:child_process';
import { build_config, Config, serialize_config } from '../config';
import { once } from 'node:events';
import { Readable } from 'node:stream';

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

    const app_root = appRootPath.path;

    const binary = path.join(app_root, 'workerd', `workerd-${platform}-${arch}`);
    return binary;
}

const wait_for_exit = (child: ChildProcess): Promise<void> => {
    return new Promise((resolve) => {
        child.once('exit', () => {
            console.log("Child process exited");
            resolve();
        });
    });
}

const wait_for_startup = async (port: number, timeout: number = 1000): Promise<void> => {
    // wait for the server to start, polling every 100ms
    const start_time = Date.now();
    while (Date.now() - start_time < timeout) {
        try {
            const response = await fetch(`http://localhost:${port}/__yukako/router-startup-check`);
            if (response.ok) {
                return;
            }
        } catch (error) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    throw new Error("Workerd failed to start");
}

const handle_output = (stdout: Readable, stderr: Readable) => {
    stdout.on("data", (data) => {
        console.log(data.toString());
    })
    stderr.on("data", (data) => {
        console.error(data.toString());
    })
}

export class WorkerdInstance {
    private binary_path: string;
    private child: ChildProcess | null;
    private exit_promise?: Promise<void>;
    private cleanupInProgress: boolean = false;

    constructor() {
        this.binary_path = getWorkerdBinary();
        this.child = null;

        // Add cleanup handlers for process termination
        process.on('SIGINT', () => this.handleSignal('SIGINT'));
        process.on('SIGTERM', () => this.handleSignal('SIGTERM'));
    }

    private async handleSignal(signal: string): Promise<void> {
        if (this.cleanupInProgress) return;
        this.cleanupInProgress = true;

        console.log(`Received ${signal}, cleaning up...`);
        try {
            await this.cleanup();
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

    public async update_config(config: Config): Promise<void> {
        const workerd_config = await build_config(config);
        const config_binary = serialize_config(workerd_config);

        await this.dispose();

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

        await wait_for_startup(config.workerd_port);
        console.log("Workerd started");
    }

    public async dispose(): Promise<void> {
        if (this.child) {
            console.log("Sending SIGTERM to child process...");
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
                console.log("Process still running, sending SIGKILL...");
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


