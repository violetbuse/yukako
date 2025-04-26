import { Command } from 'commander';
import { parse_config_file } from './lib/config';
import { create_build_context } from './lib/build';
import fs from 'fs';
import path from 'path';
import { Runtime } from '@/runtime';
import esbuild from 'esbuild';
import { WorkerConfig, Config } from '@/runtime/config';
import { ConfigManager } from '@/runtime/config/manager';

const devCommand = new Command('dev')
    .description('Start the development server')
    .option('-c, --config <path>', 'Path to the configuration file', 'yukako.config.json')
    .option('-p, --port <number>', 'Port to run the development server on', (value) => parseInt(value, 10))
    .action(async (options) => {
        const configPath = path.resolve(process.cwd(), options.config);

        if (!fs.existsSync(configPath)) {
            console.error(`Configuration file not found at ${configPath}`);
            process.exit(1);
        }

        const configContent = fs.readFileSync(configPath, 'utf-8');
        const config = parse_config_file(configContent);


        const script_path = path.resolve(path.dirname(configPath), config.script);

        if (!fs.existsSync(script_path)) {
            console.error(`Script file not found at ${script_path}`);
            process.exit(1);
        }

        const build_dir = path.resolve(path.dirname(configPath), 'dist');
        const outfile = path.resolve(build_dir, 'script');

        const config_mgr_config = ConfigManager.getInstance().get_config();
        const serve_port = (typeof options.port === 'number' ? options.port : parseInt(options.port)) || config_mgr_config.port;

        if (serve_port <= 0 || serve_port > 65535 || isNaN(serve_port)) {
            console.error(`Invalid port: ${options.port}`);
            process.exit(1);
        }

        console.log(`Starting development server with worker ID ${config.worker_id} on port ${serve_port}`);

        ConfigManager.getInstance().update_config({
            ...config_mgr_config,
            port: serve_port,
            router_config: {
                ...config_mgr_config.router_config,
                serve_admin: false,
                admin_hostnames: [],
                track_traffic: false,
            },
        });

        const callback = (result: esbuild.BuildResult) => {
            if (result.errors.length > 0) {
                console.error(result.errors);
            }

            if (result.warnings.length > 0) {
                console.warn(result.warnings);
            }

            if (result.outputFiles) {
                const main_script = result.outputFiles.find((file) => file.path === outfile);

                const other_scripts = result.outputFiles.filter((file) => file.path !== outfile);

                if (main_script) {
                    const worker_config: WorkerConfig = {
                        id: config.worker_id,
                        main_script: main_script.text,
                        compatibility_date: config.compatibility_date,
                        hostnames: ["localhost"],
                        modules: other_scripts.map((file) => ({ name: file.path.replace(build_dir, ''), type: 'esm', value: file.text })),
                    }

                    Runtime.getInstance().update_workers([worker_config]);
                    console.log('Worker rebuilt and updated');
                }
            }
        }

        const buildContext = await create_build_context(script_path, outfile, { minify: false, on_end: callback });

        Runtime.getInstance().start();

        await buildContext.watch();
        // Additional logic to start the development server can be added here
    });

export default devCommand;
