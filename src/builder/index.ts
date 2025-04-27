import { readFile } from "node:fs/promises";
import path, { dirname, resolve } from "node:path";
import { z } from "zod";
import fs from 'node:fs';
import { create_build_context, default_cli_build_context_options, File } from "@/builder/backend";

export const worker_package_schema = z.object({
    compatibility_date: z.string(),
    files: z.array(z.tuple([z.string(), z.object({
        content: z.string(),
        type: z.literal('esm')
    })])),
})

export type WorkerPackage = z.infer<typeof worker_package_schema>;

export const create_worker_package = async (config_path: string): Promise<WorkerPackage> => {
    const config = await resolve(process.cwd(), config_path);

    console.log(config);

    const working_directory = dirname(config);

    console.log(config);

    if (!fs.existsSync(config)) {
        throw new Error(`Config file not found: ${config}`);
    }

    const config_content = await readFile(config, 'utf-8');

    const config_json = JSON.parse(config_content);

    const script = config_json.script;
    const compatibility_date = config_json.compatibility_date;

    if (!script) {
        throw new Error('script is required');
    }

    if (!compatibility_date || !/^\d{4}-\d{2}-\d{2}$/.test(compatibility_date)) {
        throw new Error('compatibility_date must be in the format YYYY-MM-DD');
    }

    const script_path = resolve(path.dirname(config), script);

    if (!fs.existsSync(script_path)) {
        throw new Error('script not found');
    }

    const outdir_name = resolve(dirname(script_path), 'dist');
    const outfile_name = resolve(outdir_name, 'worker.js');

    const ctx = await create_build_context(script_path, outfile_name, { ...default_cli_build_context_options, working_directory })

    const build_result = await ctx.rebuild();

    await ctx.dispose();

    if (!build_result.outputFiles) {
        throw new Error('Failed to build worker');
    }

    const main_script = build_result.outputFiles.find(file => file.path === outfile_name);
    const other_files = build_result.outputFiles.filter(file => file.path !== outfile_name);

    if (!main_script) {
        throw new Error('Failed to find main script');
    }

    const files: [[string, File]] = [[outfile_name.replace(outdir_name, ''), {
        content: main_script.text,
        type: 'esm'
    }]];

    for (const file of other_files) {
        files.push([file.path.replace(outdir_name, ''), {
            content: file.text,
            type: 'esm'
        }]);
    }

    return {
        compatibility_date,
        files
    }
}

export const build_from_package = async (worker_package: WorkerPackage) => {
    console.log(JSON.stringify(worker_package, null, 2));
    const outfile_name = resolve(process.cwd(), 'dist', 'output.js');

    const entrypoint_name = worker_package.files[0][0];

    const files: Record<string, File> = {}

    for (const [filename, file] of worker_package.files) {
        files[filename] = {
            content: file.content,
            type: file.type,
        }
    }

    const ctx = await create_build_context(entrypoint_name, outfile_name, {
        files: files,
        bundle_with_entrypoint: true,
        allow_fallthrough: false,
        write: false
    })

    const result = await ctx.rebuild();

    await ctx.dispose();

    return result;
}
