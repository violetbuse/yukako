import { db } from "@/db";
import hash from "object-hash";
import { WorkerConfig } from "@/runtime/config";
import { ConfigManager } from "@/runtime/config/manager";

export class Manager {
    private static instance: Manager;
    private workers_hash: string;
    private poll_interval: number;
    private running: boolean;

    private constructor() {
        this.workers_hash = "";
        this.poll_interval = 10_000;
        this.running = true;
    }

    public static getInstance(): Manager {
        if (!Manager.instance) {
            Manager.instance = new Manager();
        }

        return Manager.instance;
    }

    private async poll_db_for_workers() {
        const worker_list = await db.query.workers.findMany({
            with: {
                modules: true,
                hostnames: {
                    where: (hostnames, { eq }) => eq(hostnames.verified, true)
                }
            }
        });

        const worker_hash = hash(worker_list, { algorithm: "md5" });

        if (worker_hash !== this.workers_hash) {
            this.workers_hash = worker_hash;

            const config: WorkerConfig[] = worker_list.map(worker => ({
                id: worker.id,
                main_script: worker.entrypoint,
                compatibility_date: worker.compatibility_date,
                hostnames: worker.hostnames.map(hostname => hostname.hostname)
            }));

            // pretty print the new config
            // console.log(JSON.stringify(config, null, 2));

            const current_config = ConfigManager.getInstance().get_config();

            ConfigManager.getInstance().update_config({
                ...current_config,
                workers: config
            });
        }
    }

    public async start() {
        while (this.running) {
            await this.poll_db_for_workers();
            await new Promise(resolve => setTimeout(resolve, ConfigManager.getInstance().get_config().poll_interval));
        }
    }

    public async stop() {
        this.running = false;
    }

    public async set_poll_interval(poll_interval: number) {
        this.poll_interval = poll_interval;
    }
}
