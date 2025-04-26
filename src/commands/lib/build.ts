import esbuild, { context } from 'esbuild';

export type CliBuildContextOptions = {
    write: boolean;
    minify: boolean;
    on_end?: (result: esbuild.BuildResult) => void;
}

const default_cli_build_context_options: CliBuildContextOptions = {
    write: false,
    minify: false,
}

export const create_build_context = async (filename: string, outfile: string, cli_build_context_options: Partial<CliBuildContextOptions> = {}) => {

    const options = {
        ...default_cli_build_context_options,
        ...cli_build_context_options,
    }

    const build_options: esbuild.BuildOptions = {
        entryPoints: [filename],
        outfile,
        bundle: true,
        minify: options.minify,
        format: 'esm',
        write: options.write,
    }

    const plugin: esbuild.Plugin = {
        name: 'custom-notify-plugin',
        setup(build) {

            build.onEnd((result) => {
                options.on_end?.(result);
            })
        }
    }

    const context = await esbuild.context({
        ...build_options,
        plugins: [plugin],
    })

    return context;
}
