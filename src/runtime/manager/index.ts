import { db } from "@/db";
import hash from "object-hash";
import { WorkerConfig } from "@/runtime/config";
import { isNotNull } from "drizzle-orm";
import { workers } from "@/db/schema";

export class Manager {
    private static instance: Manager;
    private workers_hash: string;
    private listeners: ((config: WorkerConfig[]) => void)[];
    private poll_interval: number;
    private running: boolean;

    private constructor() {
        this.workers_hash = "";
        this.listeners = [];
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
                hostnames: true
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

            this.listeners.forEach(listener => listener(config));
        }
    }

    public add_listener(listener: (config: WorkerConfig[]) => void) {
        this.listeners.push(listener);
    }

    public remove_listener(listener: (config: WorkerConfig[]) => void) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    public async start(poll_interval: number) {
        this.poll_interval = poll_interval;

        while (this.running) {
            await this.poll_db_for_workers();
            await new Promise(resolve => setTimeout(resolve, this.poll_interval));
        }
    }

    public async stop() {
        this.running = false;
    }

    public async set_poll_interval(poll_interval: number) {
        this.poll_interval = poll_interval;
    }
}
