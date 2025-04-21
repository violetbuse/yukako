import { Service, Worker_Binding, Config as WorkerdConfig } from "../generated/workerd_types";
import { builtin_worker_scripts } from "../workers";
import { generateConfigBinary } from "./serialize";

export type Config = {
    backend_port: number;
    workerd_port: number;
    workers: WorkerConfig[];
}

export type WorkerConfig = {
    id: string;
    main_script: string;
    compatibility_date: string;
    hostnames: string[];
}

export const build_config = async (input: Config): Promise<WorkerdConfig> => {
    const builtins = await builtin_worker_scripts();

    const worker_services = input.workers.map((worker): Service => {
        return {
            name: worker.id,
            worker: {
                modules: [{
                    name: "entrypoint.js",
                    esModule: builtins.entrypoint
                }, {
                    name: "script",
                    esModule: worker.main_script
                }],
                bindings: [],
                compatibilityDate: worker.compatibility_date
            }
        }
    })

    const router_worker_bindings = input.workers.map((worker): Worker_Binding => ({
        name: worker.id,
        service: { name: worker.id }
    }))

    const router_map: Record<string, string> = {};

    for (const worker of input.workers) {
        for (const hostname of worker.hostnames) {
            router_map[hostname] = worker.id;
        }
    }

    const workerd_config: WorkerdConfig = {
        services: [{
            name: "router",
            worker: {
                modules: [{
                    name: "router.js",
                    esModule: builtins.router
                }],
                bindings: [...router_worker_bindings, { name: "map", json: JSON.stringify(router_map) }],
                compatibilityDate: "2024-03-15"
            }
        }, {
            name: "internet",
            network: {
                allow: ["public"]
            }
        }, {
            name: "runtime_backend",
            external: {
                address: `localhost:${input.backend_port}`,
                http: {}
            }
        }, ...worker_services],
        sockets: [{
            name: "http",
            address: `*:${input.workerd_port}`,
            http: {},
            service: { name: "router" }
        }],
    }

    return workerd_config;
}

export const serialize_config = (config: WorkerdConfig): Buffer => {
    return generateConfigBinary(config);
}
