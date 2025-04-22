import { Command } from 'commander';
import { Runtime } from '../runtime';

const serveCommand = new Command('serve')
    .description('Start the server and manage worker processes')
    .option('-b, --backend-port <port>', 'Specify the backend port', process.env.BACKEND_PORT || '3000')
    .option('-w, --workerd-port <port>', 'Specify the workerd port', process.env.WORKERD_PORT || '8787')
    .option('-p, --poll-interval <interval>', 'Specify the polling interval in milliseconds', process.env.POLL_INTERVAL || '10000')
    .action(async (options) => {
        const backendPort = parseInt(options.backendPort, 10);
        const workerdPort = parseInt(options.workerdPort, 10);
        const pollInterval = parseInt(options.pollInterval, 10);

        const runtime = new Runtime(backendPort, workerdPort, pollInterval);
        await runtime.start();

        process.on('SIGINT', async () => {
            await runtime.stop();
            process.exit(0);
        });
    });

export default serveCommand;
