
import appRootPath from 'app-root-path';
import path from 'node:path';
import { spawn, ChildProcess } from 'node:child_process';
import { build_config, Config, serialize_config } from '../config';
import { once } from 'node:events';

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
    return new Promise(resolve => {
        process.once("exit", () => resolve());
    })
}

export class WorkerdInstance {
    private binary_path: string;
    private child: ChildProcess | null;
    private exit_promise?: Promise<void>;

    constructor() {
        this.binary_path = getWorkerdBinary();
        this.child = null;
    }

    public async update_config(config: Config): Promise<void> {
        const workerd_config = build_config(config);
        const config_binary = serialize_config(workerd_config);

        await this.dispose();

        this.child = spawn(this.binary_path, ['serve', '--binary', '-'], {
            stdio: ['pipe', 'pipe', 'pipe', 'pipe'],
            env: { ...process.env }
        });

        this.exit_promise = wait_for_exit(this.child);
        this.child?.stdin?.write(config_binary);
        this.child?.stdin?.end();
        await once(this.child, "exit");
    }

    public async dispose(): Promise<void> {
        this.child?.kill("SIGTERM");
        await this.exit_promise;
    }

    public async kill(): Promise<void> {
        this.child?.kill("SIGKILL");
        await this.exit_promise;
    }
}


