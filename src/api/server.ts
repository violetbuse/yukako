import { trpc_context_auth } from "@/auth/workos";
import { db } from "@/db";
import { organization_memberships } from "@/db/schema";
import { initTRPC } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import { and, eq } from "drizzle-orm";

export const t = initTRPC.context<Context>().create();

export const appRouter = t.router({});

const createContext = async ({ req, res }: trpcExpress.CreateExpressContextOptions): Promise<Context> => {
    const user = await trpc_context_auth(req, res);

    const user_id = user?.id ?? null;
    const active_organizations = await db.query.organization_memberships.findMany({
        where: and(
            eq(organization_memberships.user_id, user_id ?? ''),
            eq(organization_memberships.status, 'active')
        )
    })

    const organization_ids = active_organizations.map((organization) => organization.organization_id);

    return {
        user: user_id,
        organization_ids
    }
}

type Context = {
    user: string | null;
    organization_ids: string[];
}

export type AppRouter = typeof appRouter;

export const trpcExpressMiddleware = trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext
});