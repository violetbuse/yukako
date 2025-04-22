import { Manager } from "@/runtime/manager";
import { RuntimeBackend } from "@/runtime/server";
import { WorkerdInstance } from "@/runtime/workerd/workerd_instance";

export class Runtime {
    private workerd_instance: WorkerdInstance;
    private backend: RuntimeBackend;
    private manager: Manager;
    private poll_interval: number;
    private backend_port: number;
    private workerd_port: number;

    constructor(backend_port: number, workerd_port: number, poll_interval: number) {
        this.workerd_instance = new WorkerdInstance();
        this.backend = new RuntimeBackend({ backend_port, workerd_port, workers: [] });
        this.manager = Manager.getInstance();
        this.poll_interval = poll_interval;
        this.backend_port = backend_port;
        this.workerd_port = workerd_port;

        this.manager.add_listener(async (config) => {
            await Promise.all([
                this.workerd_instance.update_config({
                    backend_port: this.backend_port,
                    workerd_port: this.workerd_port,
                    workers: config
                }),
                this.backend.update_config({
                    backend_port: this.backend_port,
                    workerd_port: this.workerd_port,
                    workers: config
                })
            ]);
        });
    }

    public update_config(backend_port: number, workerd_port: number, poll_interval: number) {
        this.backend_port = backend_port;
        this.workerd_port = workerd_port;
        this.poll_interval = poll_interval;
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
