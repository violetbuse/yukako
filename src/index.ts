import 'dotenv/config';
import { Runtime } from './runtime';

Runtime.getInstance().start();

process.on('SIGINT', async () => {
    await Runtime.getInstance().stop();
    process.exit(0);
});