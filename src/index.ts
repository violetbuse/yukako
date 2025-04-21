import dotenv from 'dotenv';
import { WorkerdInstance } from './runtime/workerd_instance';
import { RuntimeBackend } from './runtime/server';
import { Config } from './config';

dotenv.config();

const config: Config = {
    backend_port: 3000,
    workerd_port: 8787,
    workers: [
        {
            id: "worker1",
            main_script: "export default {fetch(request) { console.log('received request', request.url); return new Response('Hello from worker1') }}",
            compatibility_date: "2024-03-15",
            hostnames: ["worker1.localhost"]
        }
    ]
}

const main = async () => {
    const runtime = new WorkerdInstance();
    await runtime.update_config(config);

    const backend = new RuntimeBackend(config);
    await backend.start();
};

main(); 