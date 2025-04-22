import express from 'express';
import { Config } from "../../config";
import http from 'http';
import { trpcExpressMiddleware } from '../../api/server';

const app = express();

// app.use('/__yukako*', (req, res, next) => {
//     const local_auth_secret = process.env.LOCAL_AUTH_TOKEN;
//     if (!local_auth_secret) {
//         res.status(500).json({ error: 'LOCAL_AUTH_TOKEN is not set' });
//         return;
//     }

//     const local_auth_token = req.headers['authorization'];
//     if (local_auth_token !== local_auth_secret) {
//         res.status(401).json({ error: 'Unauthorized' });
//         return;
//     }
//     next();
// });

app.use('/api/trpc', trpcExpressMiddleware);

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
