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
    return {}
}

type Context = {}