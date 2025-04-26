import { RouterConfig } from "@/runtime/config";
import { ConfigManager } from "@/runtime/config/manager";
import { Manager } from "@/runtime/manager";
import { YukakoBackendServer } from "@/runtime/server";
import { WorkerdInstance } from "@/runtime/workerd/workerd_instance";

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
        Manager.getInstance().start();
    }

    public async stop() {
        await WorkerdInstance.getInstance().dispose();
        await YukakoBackendServer.getInstance().stop();
        Manager.getInstance().stop();
    }
}
