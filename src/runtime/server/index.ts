import express from 'express';
import { Config } from "../../config";
import http from 'http';
const app = express();

export class RuntimeBackend {
    private config: Config;
    private server: http.Server | null;

    constructor(config: Config) {
        this.config = config;
        this.server = null;
    }

    public async start(): Promise<void> {
        this.server = app.listen(this.config.backend_port, () => {
            console.log(`Server is running on port ${this.config.backend_port}`);
        })
    }

    public async stop(): Promise<void> {
        if (this.server) {
            this.server.close();
        }
    }

    public async update_config(config: Config): Promise<void> {
        this.config = config;
        this.stop();
        this.start();
    }
}
