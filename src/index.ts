import 'dotenv/config';
import { Runtime } from './runtime';
import { mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { nanoid } from 'nanoid';

const socket_id = nanoid();
const backend_socket = join(tmpdir(), `yukako_backend_${socket_id}.sock`);

const workerdPort = parseInt(process.env.WORKERD_PORT || '8787', 10);
const pollInterval = parseInt(process.env.POLL_INTERVAL || '10000', 10);

const runtime = new Runtime(backend_socket, workerdPort, pollInterval, { serve_admin: true, admin_hostnames: ["localhost", "yukako.com"], track_traffic: true });
runtime.start();

process.on('SIGINT', async () => {
    await runtime.stop();
    process.exit(0);
});