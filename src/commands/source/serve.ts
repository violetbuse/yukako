import { Command } from 'commander';
import { verify_worker_package, config_from_package } from '@/builder';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import fs from 'node:fs';
import { Runtime } from '@/runtime';
import { ConfigManager } from '@/runtime/config/manager';
import { WorkerdInstance } from '@/runtime/workerd';

const serveCommand = new Command('serve')
    .description('Serve the built worker package')
    .option('-p, --package <path>', 'Path to the worker package file')
    .option('--port <number>', 'Port to serve the worker package on', parseInt)
    .action(async (options) => {
        try {
            const { package: packagePath } = options;

            const package_path = path.resolve(process.cwd(), packagePath || 'dist/worker.package.json');

            if (!fs.existsSync(package_path)) {
                console.error(`Worker package file not found at ${package_path}`);
                process.exit(1);
            }

            // Read the worker package file
            const packageContent = await readFile(package_path, 'utf-8');
            const workerPackage = JSON.parse(packageContent);

            // Verify the worker package
            if (!verify_worker_package(workerPackage)) {
                console.error('Invalid worker package checksum');
                process.exit(1);
            }

            const worker_config = await config_from_package(workerPackage);

            // console.log(JSON.stringify(worker_config, null, 2));

            const port = options.port || 8787;
            const current_config = ConfigManager.getInstance().get_config();
            ConfigManager.getInstance().update_config({
                ...current_config,
                port,
                router_config: {
                    ...current_config.router_config,
                    serve_admin: false,
                    track_traffic: false,
                    route_all: worker_config.id
                }
            });

            await Runtime.getInstance().update_workers([worker_config]);
            await Runtime.getInstance().start();
        } catch (error) {
            console.error('Failed to serve the worker package:', error);
        }
    });

export default serveCommand;
