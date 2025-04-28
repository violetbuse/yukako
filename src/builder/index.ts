import path, { dirname, resolve } from "node:path";
import { z } from "zod";
import { tmpdir } from "node:os";
import { nanoid } from "nanoid";
import { mkdir, writeFile } from "node:fs/promises";
import { builtin_worker_scripts } from "@/workers";
import esbuild from "esbuild";
import hash_sum from "hash-sum";
import { WorkerConfig } from "@/runtime/config";

export const worker_package_schema = z.object({
    package_checksum: z.string(),
    compatibility_date: z.string(),
    files: z.array(z.tuple([z.string(), z.object({
        content: z.string(),
        type: z.literal('esm')
    })])),
})

export type WorkerPackage = z.infer<typeof worker_package_schema>;

export const create_worker_package = async (script_path: string, compatibility_date: string): Promise<WorkerPackage> => {

    const outdir = resolve(tmpdir(), nanoid());
    const outfile = resolve(outdir, 'worker.js');

    try {
        const build_result = await esbuild.build({
            entryPoints: [script_path],
            outfile,
            bundle: true,
            platform: 'node',
            target: 'node18',
            format: 'esm',
            write: false
        })

        const output_files = build_result.outputFiles!;

        const built_entrypoint = output_files.find(file => file.path === outfile);
        const other_files = output_files.filter(file => file.path !== outfile);

        const data: Omit<WorkerPackage, 'package_checksum'> = {
            compatibility_date,
            files: [
                ['worker.js', { type: 'esm', content: built_entrypoint!.text }],
                ...other_files.map(file => [file.path.replace(outdir, ''), { type: 'esm', content: file.text }] as [string, { type: 'esm', content: string }])
            ]
        }

        const checksum = hash_sum(data);

        return {
            package_checksum: checksum,
            ...data
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Build failed: ${error.message}`);
        } else {
            throw new Error('Build failed: An unknown error occurred');
        }
    }
}

export const verify_worker_package = (worker_package: WorkerPackage): boolean => {
    const { package_checksum, ...data } = worker_package;
    const checksum = hash_sum(data);

    return checksum === package_checksum;
}

export const build_from_package = async (worker_package: WorkerPackage) => {
    const build_id = nanoid();
    const workdir = resolve(tmpdir(), build_id);
    await mkdir(workdir, { recursive: true });

    const [worker_file, ...files] = worker_package.files;

    const worker_path = resolve(workdir, 'script.js');
    await writeFile(worker_path, worker_file[1].content);

    for (const file of files) {
        const [filename, file_data] = file;
        const filepath = resolve(workdir, filename);
        await writeFile(filepath, file_data.content);
    }

    const entrypoint = (await builtin_worker_scripts()).entrypoint;
    const entrypoint_path = resolve(workdir, './entrypoint.js');
    await writeFile(entrypoint_path, entrypoint);

    const outdir = resolve(workdir, 'dist');
    await mkdir(outdir, { recursive: true });
    const outfile = resolve(outdir, 'worker.js');

    try {
        const build_result = await esbuild.build({
            entryPoints: [entrypoint_path],
            outfile,
            bundle: true,
            platform: 'node',
            target: 'node18',
            format: 'esm',
            write: false,
            minify: true
        });

        const output_files = build_result.outputFiles!;

        const built_entrypoint = output_files.find(file => file.path === outfile);
        const other_files = output_files.filter(file => file.path !== outfile);

        return {
            compatibility_date: worker_package.compatibility_date,
            entrypoint: built_entrypoint!.text,
            files: other_files.map(file => ({
                filename: file.path.replace(outdir, ''),
                content: file.text,
                type: 'esm'
            }))
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Build failed: ${error.message}`);
        } else {
            throw new Error('Build failed: An unknown error occurred');
        }
    }
}

export const config_from_package = async (worker_package: WorkerPackage): Promise<WorkerConfig> => {
    try {
        if (!verify_worker_package(worker_package)) {
            throw new Error('Invalid worker package checksum');
        }

        const built_worker = await build_from_package(worker_package);

        return {
            id: 'worker-id',
            main_script: built_worker.entrypoint,
            compatibility_date: worker_package.compatibility_date,
            hostnames: ["localhost"],
            modules: built_worker.files.map(file => ({
                name: file.filename,
                type: 'esm',
                value: file.content
            }))
        }

    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Config generation failed: ${error.message}`);
        } else {
            throw new Error('Config generation failed: An unknown error occurred');
        }
    }
}
