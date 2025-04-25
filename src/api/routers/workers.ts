import { public_procedure } from "@/api/server"
import Dns2 from "dns2"
import { router } from "@/api/server"
import { db } from "@/db"
import { workers, hostnames } from "@/db/schema"
import { TRPCError } from "@trpc/server"
import { eq, not, and } from "drizzle-orm"
import { nanoid } from "nanoid"
import { z } from "zod"

const default_worker_script = `
export default {
    async fetch(request, env) {
        return new Response("Hello, world!")
    }
}
`

const generate_verification_entry = (hostname: string) => {
    return `yukako-verification.${hostname}`
}

export const workers_router = router({
    list: public_procedure.query(async ({ ctx }) => {
        if (!ctx.user_id) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in to view this page" })
        }

        const owner_id = ctx.organization_id ? ctx.organization_id : ctx.user_id

        const workers_list = await db.query.workers.findMany({
            where: eq(workers.owner_id, owner_id)
        })

        return workers_list.map((worker) => ({
            id: worker.id,
            name: worker.name
        }))
    }),
    new: public_procedure.input(z.object({
        name: z.string(),
    })).mutation(async ({ ctx, input }) => {
        if (!ctx.user_id) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in to view this page" })
        }

        const owner_id = ctx.organization_id ? ctx.organization_id : ctx.user_id


        const worker_id = nanoid()

        const new_worker = await db.insert(workers).values({
            id: worker_id,
            owner_id,
            name: input.name,
            entrypoint: default_worker_script,
            compatibility_date: "2024-01-01"
        })

        return worker_id
    }),
    get_source: public_procedure.query(async ({ ctx }) => {
        if (!ctx.user_id) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in to view this page" })
        }

        if (!ctx.worker_id) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Worker ID is required" })
        }

        const worker = await db.query.workers.findFirst({
            where: eq(workers.id, ctx.worker_id),
            with: {
                modules: true
            }
        })

        if (!worker) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Worker not found" })
        }

        const entrypoint = {
            id: '__entrypoint__',
            name: 'worker.js (entrypoint)',
            content: worker.entrypoint,
            type: 'javascript'
        }

        const modules = worker.modules
            .map((module) => {
                let content = module.es_module || module.cjs_module || module.text_module || module.data_module || module.wasm_module || module.json_module;
                let type = '';

                if (module.es_module) {
                    type = 'es_module';
                } else if (module.cjs_module) {
                    type = 'cjs_module';
                } else if (module.text_module) {
                    type = 'text_module';
                } else if (module.data_module) {
                    type = 'data_module';
                } else if (module.wasm_module) {
                    type = 'wasm_module';
                } else if (module.json_module) {
                    type = 'json_module';
                }

                return {
                    id: module.id,
                    name: module.name,
                    content,
                    type
                }
            })
            .filter((module): module is { id: string; name: string; content: string; type: string } => module.content !== null);

        return [entrypoint, ...modules]
    }),
    get_hostnames: public_procedure.query(async ({ ctx }) => {
        if (!ctx.user_id) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in to view this page" })
        }

        if (!ctx.worker_id) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Worker ID is required" })
        }

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
    create_hostname: public_procedure.input(z.object({
        hostname: z.string(),
    })).mutation(async ({ ctx, input }) => {
        if (!ctx.user_id) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in to view this page" })
        }

        if (!ctx.worker_id) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Worker ID is required" })
        }

        const hostname_id = nanoid()

        const verification_code = nanoid()

        // hostnames ending in .localhost are verified by default
        const auto_verified = input.hostname.endsWith(".localhost")

        const new_hostname = await db.insert(hostnames).values({
            id: hostname_id,
            hostname: input.hostname,
            worker_id: ctx.worker_id,
            verification_code,
            verified: auto_verified
        })

        return new_hostname
    }),
    attempt_verify_hostname: public_procedure.input(z.object({
        hostname_id: z.string(),
    })).mutation(async ({ ctx, input }) => {
        if (!ctx.user_id) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in to view this page" })
        }

        if (!ctx.worker_id) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Worker ID is required" })
        }

        const hostname = await db.query.hostnames.findFirst({
            where: eq(hostnames.id, input.hostname_id)
        })

        if (!hostname) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Hostname not found" })
        }

        if (hostname.worker_id !== ctx.worker_id) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Hostname does not belong to this worker" })
        }

        if (hostname.verified) {
            return {
                verified: true
            }
        }

        const verification_entry = generate_verification_entry(hostname.hostname)

        const dns_client = new Dns2()


        const resolved_entry = await dns_client.query(verification_entry, "TXT")

        console.log(JSON.stringify({
            verification_entry,
            resolved_entry
        }, null, 2))

        const answers_matching_entry = resolved_entry.answers.filter((answer) => answer.name === verification_entry)
        const answers_matching_code = answers_matching_entry.filter((answer) => answer.data?.trim() === hostname.verification_code)

        const is_verified = answers_matching_code.length > 0
        const no_answers_matching_entry = answers_matching_entry.length === 0

        if (is_verified) {
            await db.transaction(async (tx) => {
                // set all other hostnames with the same hostname to not verified
                await tx.update(hostnames).set({ verified: false }).where(
                    and(
                        not(eq(hostnames.id, input.hostname_id)),
                        eq(hostnames.hostname, hostname.hostname)
                    )
                )
                // set the hostname to verified
                await tx.update(hostnames).set({ verified: true }).where(eq(hostnames.id, input.hostname_id))
            })
        } else if (no_answers_matching_entry) {
            // if there are no answers matching the entry, we un-verify all hostnames with the same hostname
            await db.update(hostnames).set({ verified: false }).where(eq(hostnames.hostname, hostname.hostname))
        }

        return {
            verified: is_verified
        }
    }),
})
