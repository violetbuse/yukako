import dotenv, { config } from 'dotenv';
import { WorkerdInstance } from './runtime/workerd_instance';
import { RuntimeBackend } from './runtime/server';
import { Config } from './config';
import { Manager } from './manager';

dotenv.config();

const backend_port = 3000;
const workerd_port = 8787;
const poll_interval = 10_000;

const main = async () => {

    const runtime = new WorkerdInstance();
    await runtime.update_config({ backend_port, workerd_port, workers: [] });

    const backend = new RuntimeBackend({ backend_port, workerd_port, workers: [] });
    await backend.start();

    const manager = Manager.getInstance();
    manager.add_listener(async (config) => {
        await runtime.update_config({ backend_port, workerd_port, workers: config });
    });
    manager.start(poll_interval);

};

main(); 