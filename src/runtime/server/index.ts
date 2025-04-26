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
import { ConfigManager } from '@/runtime/config/manager';

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

export class YukakoBackendServer {
    private static instance: YukakoBackendServer;
    private server: http.Server | null;

    private constructor() {
        this.server = null;
    }

    public static getInstance(): YukakoBackendServer {
        if (!YukakoBackendServer.instance) {
            YukakoBackendServer.instance = new YukakoBackendServer();
        }
        return YukakoBackendServer.instance;
    }

    public async start() {

        const config = ConfigManager.getInstance().get_config();
        rmSync(config.backend_socket, { force: true });

        this.server = app.listen(config.backend_socket, () => {
            console.log(`Yukako is running at ${config.backend_socket}`);
        });
    }

    public async stop() {
        if (this.server) {
            this.server.close();
        }
    }

    public async restart() {
        await this.stop();
        await this.start();
    }
}
