/// <reference types="@clerk/express/env" />

import { db } from "@/db";
import { getAuth } from "@clerk/express";
import { initTRPC, TRPCError } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import { and, eq, isNull } from "drizzle-orm";
import { WORKER_ID_COOKIE_NAME } from "@/client/components/worker_switcher";
import { workers } from "@/db/schema";

export const t = initTRPC.context<Context>().create();

export const router = t.router;
export const public_procedure = t.procedure;

export const user_procedure = t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.user_id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const user_id = ctx.user_id;

    return next({ ctx: { user_id } });
});

export const worker_procedure = t.procedure.use(async ({ ctx, next }) => {

    if (!ctx.user_id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    if (!ctx.worker_id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const user_id = ctx.user_id;
    const worker_id = ctx.worker_id;

    return next({ ctx: { user_id, worker_id } });
});

export const createTRPCServerContext = async ({ req, res }: trpcExpress.CreateExpressContextOptions): Promise<Context> => {

    if (!req.auth?.userId) {
        return {
            user_id: null,
            organization_id: null,
            org_role: null,
            org_slug: null
        }
    }

    const auth = await getAuth(req);

    if (!auth.userId) {
        return {
            user_id: null,
            organization_id: null,
            org_role: null,
            org_slug: null
        }
    }

    const token = await auth.getToken();

    if (!token) {
        return {
            user_id: null,
            organization_id: null,
            org_role: null,
            org_slug: null
        }
    }

    const selected_worker_id = req.cookies[WORKER_ID_COOKIE_NAME];

    const owner_id = auth.orgId ?? auth.userId;

    const worker = await db.query.workers.findFirst({
        where: and(
            eq(workers.owner_id, owner_id),
            eq(workers.id, selected_worker_id)
        )
    });

    const worker_id = worker?.id ?? null;

    if (!auth.orgId) {
        return {
            user_id: auth.userId,
            organization_id: null,
            org_role: null,
            org_slug: null,
            token,
            owner_id: auth.userId,
            worker_id
        }
    }

    if (!auth.orgRole || !auth.orgSlug) {
        return {
            user_id: auth.userId,
            organization_id: null,
            org_role: null,
            org_slug: null,
            token,
            owner_id: auth.userId,
            worker_id
        }
    }

    return {
        user_id: auth.userId,
        organization_id: auth.orgId,
        org_role: auth.orgRole,
        org_slug: auth.orgSlug,
        token,
        owner_id: auth.orgId,
        worker_id
    }
}

type Context = {
    user_id: null
    organization_id: null
    org_role: null
    org_slug: null
} | (({
    user_id: string
    organization_id: null
    org_role: null
    org_slug: null
} | {
    user_id: string
    organization_id: string
    org_role: string
    org_slug: string
}) & {
    token: string
    owner_id: string
    worker_id: string | null
})