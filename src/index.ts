import dotenv from 'dotenv';
import { WorkerdInstance } from './runtime/workerd_instance';
import { RuntimeBackend } from './runtime/server';

dotenv.config();

const main = async () => {
    const runtime = new WorkerdInstance();
    await runtime.update_config({});

    const backend = new RuntimeBackend();
    await backend.start();
};

main(); 