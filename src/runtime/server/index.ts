import express from 'express';
import { Config } from "../../config";
const app = express();

app.get('/', async (_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello, World!');
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
