import { trpc_context_auth } from "@/auth/workos";
import { db } from "@/db";
import { organization_memberships } from "@/db/schema";
import { initTRPC, TRPCError } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

export const t = initTRPC.context<Context>().create();

export const router = t.router;
export const public_procedure = t.procedure;


export const createTRPCServerContext = async ({ req, res }: trpcExpress.CreateExpressContextOptions): Promise<Context> => {
    const user = await trpc_context_auth(req, res);

    const user_id = user?.id ?? null;

    let organization_ids: string[] = [];

    if (user_id) {
        const active_organizations = await db.query.organization_memberships.findMany({
            where: and(
                eq(organization_memberships.user_id, user_id ?? ''),
                eq(organization_memberships.status, 'active'),
                isNull(organization_memberships.deleted_at)
            )
        })

        organization_ids = active_organizations.map((organization) => organization.organization_id);
    }

    return {
        user: user_id,
        organization_ids
    }
}

export const authed_procedure = t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const new_ctx = {
        user_id: ctx.user as string,
        organization_ids: ctx.organization_ids
    }

    return next({ ctx: new_ctx });
})

export const organization_procedure = t.procedure.input(z.string()).use(async ({ ctx, input, next }) => {

    if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    if (!ctx.organization_ids.includes(input)) {
        throw new TRPCError({ code: 'FORBIDDEN' });
    }

    return next({ ctx });
})

type Context = {
    user: string | null;
    organization_ids: string[];
}