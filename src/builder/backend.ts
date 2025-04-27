import { builtin_worker_scripts } from "@/workers";
import esbuild from "esbuild";
import { tmpdir } from "node:os";
import path from "node:path";
export type YukakoBuildContextOptions = {
    write: boolean;
    minify: boolean;
    on_end?: (result: esbuild.BuildResult) => void;
    files?: Record<string, File>;
    bundle_with_entrypoint: boolean;
    allow_fallthrough: boolean;
    working_directory: string;
}

export type File = {
    content: string;
    type: 'esm'
}

export const default_cli_build_context_options: YukakoBuildContextOptions = {
    write: false,
    minify: false,
    allow_fallthrough: true,
    working_directory: process.cwd(),
    bundle_with_entrypoint: false
}

export const default_backend_build_context_options: YukakoBuildContextOptions = {
    write: false,
    minify: true,
    allow_fallthrough: false,
    working_directory: tmpdir(),
    bundle_with_entrypoint: false
}

const create_worker_entrypoint_plugin = (main_script_content: string): esbuild.Plugin => {
    return {
        name: 'custom-notify-plugin',
        setup(build) {
            console.log('setting up worker entrypoint plugin')
            build.onLoad({ filter: /.*/ }, async (args) => {
                console.log(args.path)
                if (args.path.endsWith('source')) {
                    return {
                        contents: main_script_content,
                        loader: 'js'
                    }
                } else if (args.path.endsWith('entrypoint')) {
                    return {
                        contents: (await builtin_worker_scripts()).entrypoint,
                        loader: 'js'
                    }
                }
            })
        }
    }
}

const create_onload_plugin = (files: Record<string, File>, working_directory: string, allow_fallthrough: boolean = false): esbuild.Plugin => {
    return {
        name: 'custom-notify-plugin',
        setup(build) {
            build.onLoad({ filter: /.*/ }, async (args) => {
                const filename = args.path;
                const file_path = filename.replace(working_directory, '');
                const file = files[file_path];

                if (!file) {
                    if (allow_fallthrough) {
                        return null;
                    } else {
                        throw new Error(`File not found: ${filename}`);
                    }
                }

                let loader: esbuild.Loader;

                switch (file.type) {
                    case 'esm':
                        loader = 'js';
                        break;
                }

                return {
                    loader,
                    contents: file.content,
                }
            })
        }
    }
}

const create_notify_plugin = (on_end: (result: esbuild.BuildResult) => void): esbuild.Plugin => {
    return {
        name: 'custom-notify-plugin',
        setup(build) {
            build.onEnd((result) => {
                on_end(result);
            })
        }
    }
}

export const create_build_context = async (filename: string, outfile: string, cli_build_context_options: Partial<YukakoBuildContextOptions> = {}) => {

    const options = {
        ...default_backend_build_context_options,
        ...cli_build_context_options,
    }

    const plugins: esbuild.Plugin[] = []

    const mainscript_content = cli_build_context_options.files?.[filename];

    console.log('filename', filename)
    console.log('outfile', outfile)
    console.log('mainscript_content', mainscript_content)
    console.log('options.bundle_with_entrypoint', options.bundle_with_entrypoint)
    console.log('options.working_directory', options.working_directory)
    console.log(JSON.stringify(cli_build_context_options.files, null, 2))

    if (options.bundle_with_entrypoint && mainscript_content) {
        console.log('pushing plugin for entrypoint')
        plugins.push(create_worker_entrypoint_plugin(mainscript_content.content));
    }

    if (cli_build_context_options.files) {
        plugins.push(create_onload_plugin(cli_build_context_options.files, options.working_directory, options.allow_fallthrough));
    }

    if (cli_build_context_options.on_end) {
        plugins.push(create_notify_plugin(cli_build_context_options.on_end));
    }

    const entrypoints = options.bundle_with_entrypoint ? ['entrypoint'] : [filename];

    const build_options: esbuild.BuildOptions = {
        entryPoints: entrypoints,
        outfile,
        bundle: true,
        minify: options.minify,
        format: 'esm',
        write: options.write,
        absWorkingDir: options.working_directory,
    }

    const context = await esbuild.context({
        ...build_options,
        plugins,
    })

    return context;
}