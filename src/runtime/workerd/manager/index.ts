import { db } from "@/db";
import sum from 'hash-sum';
import { WorkerConfig } from "@/runtime/config";
import { ConfigManager } from "@/runtime/config/manager";
import { deployments, hostnames, modules } from "@/db/schema";
import { aliasedTable, and, desc, eq, max, sql } from "drizzle-orm";

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

        const max_versions = db.select({ max: max(deployments.version), worker_id: deployments.worker_id }).from(deployments).groupBy(deployments.worker_id).as('max_versions');

        const raw_data = await db
            .select()
            .from(max_versions)
            .innerJoin(deployments,
                and(
                    eq(max_versions.worker_id, deployments.worker_id),
                    eq(max_versions.max, deployments.version)))
            .leftJoin(modules, eq(deployments.id, modules.deployment_id))
            .leftJoin(hostnames,
                and(
                    eq(deployments.worker_id, hostnames.worker_id),
                    eq(hostnames.verified, true)))
            .iterator();

        const config: WorkerConfig[] = [];

        for await (const row of raw_data) {
            const worker_id = row.deployments.worker_id;
            const main_script: string | undefined = row.modules?.entrypoint ? row.modules.value : undefined;
            const compatibility_date = row.deployments.compatibility_date;
            const hostname = row.hostnames?.hostname;
            const module_name = main_script === undefined ? row.modules?.name : undefined;
            const module_type = main_script === undefined ? row.modules?.type : undefined;
            const module_value = main_script === undefined ? row.modules?.value : undefined;

            const config_idx = config.findIndex(c => c.id === worker_id);

            if (config_idx === -1) {
                config.push({
                    id: worker_id,
                    main_script: main_script ?? "",
                    compatibility_date,
                    hostnames: hostname ? [hostname] : [],
                    modules: module_name && module_type && module_value ? [{
                        name: module_name,
                        type: module_type,
                        value: module_value
                    }] : [],
                });
            } else {
                config[config_idx].compatibility_date = compatibility_date;

                if (main_script) {
                    config[config_idx].main_script = main_script;
                }

                if (hostname) {
                    config[config_idx].hostnames.push(hostname);
                }

                if (module_name && module_type && module_value) {
                    const existing_module = config[config_idx].modules.find(m => m.name === module_name);
                    if (existing_module) {
                        existing_module.type = module_type;
                        existing_module.value = module_value;
                    } else {
                        config[config_idx].modules.push({ name: module_name, type: module_type, value: module_value });
                    }
                }
            }
        }

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
