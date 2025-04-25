import express from 'express';
import { Config } from "@/runtime/config";
import http from 'http';
import * as trpcExpress from '@trpc/server/adapters/express';
import { resolve } from 'path';
import morgan from 'morgan';
import { Request, Response, NextFunction } from 'express';
import { appRouter } from '@/api/routers';
import { createTRPCServerContext } from '@/api/server';
import cookieParser from 'cookie-parser';
import { clerkMiddleware } from '@clerk/express';
import { rmSync } from 'fs';
import { yukako_backend_router } from '@/runtime/backend/router';

const directory = __dirname;

const client_files = resolve(directory, "client")

console.log(client_files);

const app = express();

app.use(clerkMiddleware({
    publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
}));

app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

app.use(express.json());
app.use(cookieParser());
app.use(morgan(':method :url :status - :response-time ms'));

app.use('/api/trpc', trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCServerContext
}));

app.use('/__yukako', yukako_backend_router);

app.use(express.static(client_files, {
    dotfiles: 'ignore',
    index: "index.html",
    redirect: true,
    extensions: ['html', 'htm'],
    fallthrough: true,
}));

app.use((req: Request, res: Response, next: NextFunction) => {
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
        const socket = this.config.backend_socket;
        rmSync(socket, { force: true });
        this.server = app.listen(socket, () => {
            console.log(`Yukako is running at ${socket}`);
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
