import { public_procedure, router, worker_procedure } from "@/api/server";
import { hostnames } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { eq, not, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import Dns2 from "dns2";
import { generate_verification_entry, verify_hostname } from "@/lib/hostnames";

export const hostnames_router = router({
    list: worker_procedure.query(async ({ ctx }) => {
        const hostnames_list = await db.query.hostnames.findMany({
            where: eq(hostnames.worker_id, ctx.worker_id)
        })

        return hostnames_list.map((hostname) => ({
            id: hostname.id,
            hostname: hostname.hostname,
            worker_id: hostname.worker_id,
            verified: hostname.verified,
            verification_code: hostname.verification_code,
            verification_entry: generate_verification_entry(hostname.hostname)
        }))
    }),
    new: worker_procedure.input(z.object({
        hostname: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const hostname_id = nanoid()

        const verification_code = nanoid()

        // hostnames ending in .localhost are verified by default
        const auto_verified = input.hostname.endsWith(".localhost")

        if (auto_verified) {
            const existing_with_same_hostname = await db.query.hostnames.findFirst({
                where: eq(hostnames.hostname, input.hostname)
            })

            if (existing_with_same_hostname) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Hostname already exists" })
            }
        }

        const new_hostname = await db.insert(hostnames).values({
            id: hostname_id,
            hostname: input.hostname,
            worker_id: ctx.worker_id,
            verification_code,
            verified: auto_verified
        })

        return new_hostname
    }),
    delete: worker_procedure.input(z.object({
        hostname_id: z.string(),
    })).mutation(async ({ ctx, input }) => {

        const hostname = await db.query.hostnames.findFirst({
            where: eq(hostnames.id, input.hostname_id)
        })

        if (!hostname) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Hostname not found" })
        }

        if (hostname.worker_id !== ctx.worker_id) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Hostname does not belong to this worker" })
        }

        await db.delete(hostnames).where(eq(hostnames.id, input.hostname_id))

        return true
    }),
    attempt_verify_hostname: worker_procedure.input(z.object({
        hostname_id: z.string(),
    })).mutation(async ({ ctx, input }) => {

        const hostname = await db.query.hostnames.findFirst({
            where: eq(hostnames.id, input.hostname_id)
        })

        if (!hostname) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Hostname not found" })
        }

        if (hostname.worker_id !== ctx.worker_id) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Hostname does not belong to this worker" })
        }

        const { verified } = await verify_hostname(input.hostname_id)

        return verified
    })
})
