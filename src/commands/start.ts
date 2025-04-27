import { Command } from 'commander';
import { create_build_context } from '@/builder/backend';
import { build_config } from '@/runtime/config';
import { Config } from '@/runtime/config/index';
import { parse_config_file } from '@/commands/lib/config';
import { create_worker_package, build_from_package } from '@/builder';
import fs from 'fs/promises';
import fsSync from 'fs';

const startCommand = new Command('start')
    .description('Start the build process with the given configuration')
    .requiredOption('-c, --config <path>', 'Path to the configuration file')
    .action(async (options) => {
        try {
            let config_path = options.config;

            if (!config_path || typeof config_path !== 'string') {
                config_path = "yukako.config.json"
            }

            if (!fsSync.existsSync(config_path)) {
                throw new Error(`Config file not found: ${config_path}`);
            }

            const config_content = await fs.readFile(config_path, 'utf8');

            const config = await parse_config_file(config_content);

            const worker_package = await create_worker_package(config_path);

            const build_result = await build_from_package(worker_package);

            console.log(JSON.stringify(build_result, null, 2));

        } catch (error) {
            console.error('Error during the build process:', error);
        }
    });

export default startCommand;