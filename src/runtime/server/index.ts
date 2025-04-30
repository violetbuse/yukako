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
import { clerkMiddleware, getAuth } from '@clerk/express';
import { rmSync } from 'fs';
import { yukako_backend_router } from '@/runtime/backend/router';
import { ConfigManager } from '@/runtime/config/manager';
import * as body_parser from 'body-parser';
import { CLERK_SECRET_KEY, clerk_client, CLERK_PUBLIC_KEY } from '@/auth/clerk';
import { db } from '@/db';
import { workers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { worker_package_schema, build_from_package } from '@/lib/builder';

const directory = __dirname;

const client_files = resolve(directory, "client")

const app = express();

app.use(clerkMiddleware({
    publishableKey: CLERK_PUBLIC_KEY,
    secretKey: CLERK_SECRET_KEY,
}));

app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

app.use(body_parser.json());
app.use(body_parser.text());
app.use(cookieParser());
app.use(morgan(':method :url :status - :response-time ms'));

app.use('/api/trpc', trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCServerContext
}));

app.get("/api/cli/me", async (req, res) => {
    const { orgId, userId } = getAuth(req);

    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    const user = await clerk_client.users.getUser(userId);
    const org = orgId ? await clerk_client.organizations.getOrganization({ organizationId: orgId }) : null;

    res.json({
        user: {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress ?? null,
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
            username: user.username ?? null,
        },
        org: org ? {
            id: org.id,
            name: org.name,
            slug: org.slug,
        } : null
    })
})

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
            // console.log(`Yukako is running at ${config.backend_socket}`);
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
