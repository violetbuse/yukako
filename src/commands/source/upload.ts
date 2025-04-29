import { Command } from 'commander';
import { db } from '@/db';
import { workers, modules } from '@/db/schema';
import { build_from_package, verify_worker_package, worker_package_schema } from '@/builder';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import path from 'node:path';
import fs from 'node:fs';
import { parse_config_file } from '@/commands/lib/config';
import { trpc } from '@/commands/lib/trpc';
import { whoami as whoami_command } from '@/commands/lib/auth/whoami';

const uploadCommand = new Command("upload")
    .description('Upload a new worker package')
    .option('-c, --config <config>', 'Path to the config JSON file', './yukako.config.json')
    .option('-p, --package <package>', 'Path to the worker package JSON file')
    .action(async (options) => {
        try {
            const { config: configPath, package: packagePath } = options;

            const config_path = path.resolve(process.cwd(), configPath);

            if (!fs.existsSync(config_path)) {
                throw new Error(`Config file not found at ${config_path}`);
            }

            const config_raw = JSON.parse(fs.readFileSync(config_path, 'utf8'));

            const config = parse_config_file(config_raw);

            const worker_id = config.worker_id;

            const whoami = await whoami_command();

            if (!whoami || !whoami.user || !whoami.user.id) {
                console.error('You must be logged in to upload a worker package');
                process.exit(1);
            }

            const package_path = path.resolve(process.cwd(), packagePath || 'dist/worker.package.json');

            if (!fs.existsSync(package_path)) {
                throw new Error(`Worker package file not found at ${package_path}`);
            }

            const package_raw = JSON.parse(fs.readFileSync(package_path, 'utf8'));

            const package_data = worker_package_schema.parse(package_raw);
            const valid_package = verify_worker_package(package_data);

            if (!valid_package) {
                throw new Error('Invalid worker package');
            }

            try {
                const upload_result = await trpc.workers.upload_source_package.mutate({
                    worker_id,
                    package: package_data
                });

                if (upload_result) {
                    console.log('Worker package uploaded successfully');
                } else {
                    console.error('There was an error uploading the worker package');
                    process.exit(1);
                }
            } catch (error) {
                if (error instanceof TRPCError) {
                    console.error(error.message);
                } else {
                    console.error('There was an error uploading the worker package');
                }
                process.exit(1);
            }
        } catch (error) {
            if (error instanceof Error) {
                console.error(error.message);
            } else {
                console.error('An unknown error occurred');
            }
            process.exit(1);
        }
    });

export default uploadCommand;
