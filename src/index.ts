import 'dotenv/config';
import { Runtime } from './runtime';
import cluster from 'cluster';
import os from 'os';
import { ConfigManager } from './runtime/config/manager';

// Runtime.getInstance().start();

// process.on('SIGINT', async () => {
//     await Runtime.getInstance().stop();
//     process.exit(0);
// });

const clustering_enabled = process.env.CLUSTERING_ENABLED === "true" || process.env.CLUSTERING_ENABLED === "1" || process.argv.includes("--cluster");
const cpus = os.cpus().length;

const run_production_node = () => {
    const config_manager = ConfigManager.getInstance();


    config_manager.update_config({
        ...config_manager.get_config(),
        // Production nodes update worker configs at most every minute
        worker_update_debounce_interval: 60_000
    });

    Runtime.getInstance().start();
    Runtime.getInstance().start_config_manager();

    process.on('SIGINT', async () => {
        await Runtime.getInstance().stop();
        process.exit(0);
    });
}

if (cluster.isPrimary && clustering_enabled) {

    console.log(`Yukako is running in cluster mode with ${cpus} workers`);

    for (let i = 0; i < cpus; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker) => {
        console.log(`Worker ${worker.id} died`);
    });
}

if (cluster.isWorker || !clustering_enabled) {
    run_production_node();
}

