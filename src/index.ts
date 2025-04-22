import dotenv, { config } from 'dotenv';
import { WorkerdInstance } from './runtime/workerd_instance';
import { RuntimeBackend } from './runtime/server';
import { Manager } from './manager';

dotenv.config();

const backend_port = parseInt(process.env.BACKEND_PORT || '3000');
const workerd_port = parseInt(process.env.WORKERD_PORT || '8787');
const poll_interval = parseInt(process.env.POLL_INTERVAL || '10_000');

const main = async () => {

    const runtime = new WorkerdInstance();

    const backend = new RuntimeBackend({ backend_port, workerd_port, workers: [] });
    await backend.start();

    const manager = Manager.getInstance();
    manager.add_listener(async (config) => {
        await Promise.all([
            runtime.update_config({ backend_port, workerd_port, workers: config }),
            backend.update_config({ backend_port, workerd_port, workers: config })
        ]);
    });
    manager.start(poll_interval);

};

main(); 