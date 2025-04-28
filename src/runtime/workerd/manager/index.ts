import { db } from "@/db";
import sum from 'hash-sum';
import { WorkerConfig } from "@/runtime/config";
import { ConfigManager } from "@/runtime/config/manager";

export class WorkerdConfigManager {
    private static instance: WorkerdConfigManager;
    private workers_hash: string;
    private poll_interval: number;
    private running: boolean;

    private constructor() {
        this.workers_hash = "";
        this.poll_interval = 10_000;
        this.running = true;
    }

    public static getInstance(): WorkerdConfigManager {
        if (!WorkerdConfigManager.instance) {
            WorkerdConfigManager.instance = new WorkerdConfigManager();
        }

        return WorkerdConfigManager.instance;
    }

    private async handle_worker_update(workers: WorkerConfig[]) {

        const worker_hash = sum(workers);

        if (worker_hash !== this.workers_hash) {
            this.workers_hash = worker_hash;


            // console.log(`[manager] updating config with ${workers.length} workers`);
            // console.log(JSON.stringify(workers, null, 2));

            // pretty print the new config
            // console.log(JSON.stringify(config, null, 2));

            const current_config = ConfigManager.getInstance().get_config();

            ConfigManager.getInstance().update_config({
                ...current_config,
                workers: workers
            });
        }
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

        const config: WorkerConfig[] = worker_list.map(worker => ({
            id: worker.id,
            main_script: worker.entrypoint,
            compatibility_date: worker.compatibility_date,
            hostnames: worker.hostnames.map(hostname => hostname.hostname),
            modules: worker.modules.map(module => {
                return {
                    name: module.name,
                    type: module.type,
                    value: module.value
                }
            })
        }));

        await this.handle_worker_update(config);

    }

    public async update_workers(workers: WorkerConfig[]) {
        await this.handle_worker_update(workers);
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
