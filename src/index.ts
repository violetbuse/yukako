import 'dotenv/config';
import { Runtime } from './runtime';

const backendPort = parseInt(process.env.BACKEND_PORT || '3000', 10);
const workerdPort = parseInt(process.env.WORKERD_PORT || '8787', 10);
const pollInterval = parseInt(process.env.POLL_INTERVAL || '10000', 10);

const runtime = new Runtime(backendPort, workerdPort, pollInterval);
runtime.start();

process.on('SIGINT', async () => {
    await runtime.stop();
    process.exit(0);
});