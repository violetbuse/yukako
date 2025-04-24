/// <reference types="@clerk/express/env" />

import { db } from "@/db";
import { getAuth } from "@clerk/express";
import { initTRPC, TRPCError } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

export const t = initTRPC.context<Context>().create();

export const router = t.router;
export const public_procedure = t.procedure;


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

    if (!auth.orgId) {
        return {
            user_id: auth.userId,
            organization_id: null,
            org_role: null,
            org_slug: null,
            token
        }
    }

    if (!auth.orgRole || !auth.orgSlug) {
        return {
            user_id: auth.userId,
            organization_id: null,
            org_role: null,
            org_slug: null,
            token
        }
    }

    return {
        user_id: auth.userId,
        organization_id: auth.orgId,
        org_role: auth.orgRole,
        org_slug: auth.orgSlug,
        token
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
})