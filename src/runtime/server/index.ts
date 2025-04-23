import express from 'express';
import { Config } from "@/config";
import http from 'http';
import * as trpcExpress from '@trpc/server/adapters/express';
import { resolve } from 'path';
import { auth_router } from '@/runtime/server/auth';
import morgan from 'morgan';
import { Request, Response, NextFunction } from 'express';
import { appRouter } from '@/api/routers';
import { createTRPCServerContext } from '@/api/server';
import cookieParser from 'cookie-parser';

const directory = __dirname;

const client_files = resolve(directory, "client")

console.log(client_files);

const app = express();

app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

app.use(express.json());
app.use(cookieParser());
app.use(morgan('tiny'));

app.use(express.static(client_files, {
    dotfiles: 'ignore',
    index: "index.html",
    redirect: true,
    extensions: ['html', 'htm'],
    fallthrough: true,
}));

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

app.use('/api/trpc', trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCServerContext
}));

app.use('/api/auth', auth_router);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    res.sendFile(resolve(client_files, 'index.html'), (err) => {
        if (err) {
            next(err);
        }
    });
});


export class RuntimeBackend {
    private config: Config;
    private server: http.Server | null;

    constructor(config: Config) {
        this.config = config;
        this.server = null;
    }

    public async start(): Promise<void> {
        this.server = app.listen(this.config.backend_port, () => {
            console.log(`Yukako is running at http://localhost:${this.config.backend_port}`);
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
