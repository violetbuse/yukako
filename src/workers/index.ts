import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

type WorkerScripts = {
    router: string;
    entrypoint: string;
}

export const builtin_worker_scripts = async () => {
    const directory = __dirname;

    const router_path = resolve(directory, "workers/router.js");
    const router_content = await readFile(router_path, "utf-8");
    const entrypoint_path = resolve(directory, "workers/entrypoint.js");
    const entrypoint_content = await readFile(entrypoint_path, "utf-8");

    return {
        router: router_content,
        entrypoint: entrypoint_content
    }
}
