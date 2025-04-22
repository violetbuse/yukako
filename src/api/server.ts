import { initTRPC } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";

export const t = initTRPC.create();

export const appRouter = t.router<Context>({});

const createContext = async ({ req, res }: trpcExpress.CreateExpressContextOptions) => {
    return {}
}

type Context = Awaited<ReturnType<typeof createContext>>;

export type AppRouter = typeof appRouter;

export const trpcExpressMiddleware = trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext
});