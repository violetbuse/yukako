import express from 'express';
import { Config } from "../../config";
const app = express();

app.get('/', async (_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello, World!');
})

app.post('/:worker_id/logger/:level', async (req, res) => {
    const { worker_id, level } = req.params;
    const { message } = req.body;

    const levels = ["log", "error", "warn", "info", "debug"] as const;
    if (!levels.includes(level as any)) {
        res.status(400).send('Invalid log level');
        return;
    }

    const log_fns = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug
    }

    console.log('received log request', worker_id, level, message);

    log_fns[level as keyof typeof log_fns](`[${worker_id}] ${message}`);
    res.sendStatus(200);
})

export class RuntimeBackend {
    private config: Config;
    private app: express.Application;

    constructor(config: Config) {
        this.config = config;
        this.app = express();
    }

    public async start(): Promise<void> {
        this.app.listen(this.config.backend_port, () => {
            console.log(`Server is running on port ${this.config.backend_port}`);
        })
    }
}
