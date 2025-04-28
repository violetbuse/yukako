
import { Command } from 'commander';
import { create_worker_package } from '@/builder';
import { build_config, serialize_config } from '@/runtime/config';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import fs from 'node:fs';

const buildCommand = new Command('build')
    .description('Build the worker package and generate configuration')
    .option('-c, --config <path>', 'Path to the configuration file')
    .option('-o, --output <path>', 'Output directory for the built package')
    .action(async (options) => {
        try {
            const { config: configPath, output } = options;

            const config_path = path.resolve(process.cwd(), configPath || 'yukako.config.json');

            if (!fs.existsSync(config_path)) {
                console.error(`Configuration file not found at ${config_path}`);
                process.exit(1);
            }

            // Read the configuration file
            const configContent = await fs.promises.readFile(config_path, 'utf-8');
            const configData = JSON.parse(configContent);

            const config_dir = path.dirname(config_path);
            const script_path = path.resolve(config_dir, configData.script);

            // Create the worker package
            const workerPackage = await create_worker_package(script_path, configData.compatibility_date);

            const output_dir = output ? path.resolve(process.cwd(), output) : path.resolve(config_dir, 'dist');
            await mkdir(output_dir, { recursive: true });

            await writeFile(path.join(output_dir, 'worker.package.json'), JSON.stringify(workerPackage, null, 2));
        } catch (error) {
            console.error('Failed to build and generate configuration:', error);
        }
    });

export default buildCommand;
