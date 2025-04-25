import { RouterConfig } from "@/runtime/config";
import { Manager } from "@/runtime/manager";
import { RuntimeBackend } from "@/runtime/server";
import { WorkerdInstance } from "@/runtime/workerd/workerd_instance";

export class Runtime {
    private workerd_instance: WorkerdInstance;
    private backend: RuntimeBackend;
    private manager: Manager;
    private poll_interval: number;
    private backend_socket: string;
    private workerd_port: number;
    private router_config: RouterConfig;

    constructor(backend_socket: string, workerd_port: number, poll_interval: number, router_config: RouterConfig) {
        this.workerd_instance = new WorkerdInstance();
        this.backend = new RuntimeBackend({ backend_socket, workerd_port, workers: [], router_config });
        this.manager = Manager.getInstance();
        this.poll_interval = poll_interval;
        this.backend_socket = backend_socket;
        this.workerd_port = workerd_port;
        this.router_config = router_config;
        this.manager.add_listener(async (config) => {
            await Promise.all([
                this.workerd_instance.update_config({
                    backend_socket: this.backend_socket,
                    workerd_port: this.workerd_port,
                    workers: config,
                    router_config: this.router_config
                }),
                this.backend.update_config({
                    backend_socket: this.backend_socket,
                    workerd_port: this.workerd_port,
                    workers: config,
                    router_config: this.router_config
                })
            ]);
        });
    }

    public update_config(backend_socket: string, workerd_port: number, poll_interval: number, router_config: RouterConfig) {
        this.backend_socket = backend_socket;
        this.workerd_port = workerd_port;
        this.poll_interval = poll_interval;
        this.router_config = router_config;
    }

    public async start() {
        this.manager.start(this.poll_interval);
    }

    public async stop() {
        await this.backend.stop();
        await this.workerd_instance.dispose();
        this.manager.stop();
    }
}
