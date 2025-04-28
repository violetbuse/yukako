import { Service, Worker_Binding, Config as WorkerdConfig, Worker_Module } from "@/generated/workerd_types";
import { builtin_worker_scripts } from "@/workers";
import { generateConfigBinary } from "@/runtime/config/serialize";

export type Config = {
    port: number;
    backend_socket: string;
    workerd_socket: string;
    router_config: RouterConfig;
    poll_interval: number;
    workers: WorkerConfig[];
}

export type WorkerConfig = {
    id: string;
    main_script: string;
    compatibility_date: string;
    hostnames: string[];
    modules: WorkerConfigModule[];
}

export type WorkerConfigModule = {
    name: string;
    type: "esm";
    value: string;
}

export type RouterConfig = {
    serve_admin: boolean;
    admin_hostnames: string[];
    track_traffic: boolean;
    route_all?: string | null;
}

export const build_config = async (input: Config): Promise<WorkerdConfig> => {
    const builtins = await builtin_worker_scripts();

    const worker_services = input.workers.map((worker): Service => {

        const aux_modules = worker.modules.map((module): Worker_Module => ({
            name: module.name,
            esModule: module.value
        }))

        return {
            name: worker.id,
            worker: {
                modules: [{
                    name: "script",
                    esModule: worker.main_script
                }, ...aux_modules],
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
                bindings: [...router_worker_bindings,
                { name: "map", json: JSON.stringify(router_map) },
                { name: "backend", service: { name: "runtime_backend" } }, {
                    name: "config", json: JSON.stringify(input.router_config)
                }],
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
                address: `unix:${input.backend_socket}`,
                http: {}
            }
        }, ...worker_services],
        sockets: [{
            name: "http",
            address: `unix:${input.workerd_socket}`,
            http: {},
            service: { name: "router" }
        }],
    }

    return workerd_config;
}

export const serialize_config = (config: WorkerdConfig): Buffer => {
    return generateConfigBinary(config);
}
