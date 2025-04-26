import { RouterConfig, WorkerConfig } from "@/runtime/config";
import { ConfigManager } from "@/runtime/config/manager";
import { WorkerdConfigManager } from "@/runtime/workerd/manager";
import { YukakoBackendServer } from "@/runtime/server";
import { WorkerdInstance } from "@/runtime/workerd";
import { Proxy } from "@/runtime/proxy";

export class Runtime {

    private static instance: Runtime;

    private constructor() {
        ConfigManager.getInstance().subscribe(async () => {
            await Promise.all([
                WorkerdInstance.getInstance().reload_config(),
                YukakoBackendServer.getInstance().restart()
            ]);
        });
    }

    public static getInstance(): Runtime {
        if (!Runtime.instance) {
            Runtime.instance = new Runtime();
        }
        return Runtime.instance;
    }

    public async start() {
        Proxy.getInstance().start();
    }

    public async stop() {
        await WorkerdInstance.getInstance().dispose();
        await YukakoBackendServer.getInstance().stop();
        Proxy.getInstance().stop();
    }

    public async start_config_manager() {
        WorkerdConfigManager.getInstance().start();
    }

    public async update_workers(workers: WorkerConfig[]) {
        WorkerdConfigManager.getInstance().update_workers(workers);
    }
}
