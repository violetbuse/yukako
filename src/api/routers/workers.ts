import { public_procedure } from "@/api/server"
import Dns2 from "dns2"
import { router } from "@/api/server"
import { db } from "@/db"
import { workers, hostnames } from "@/db/schema"
import { TRPCError } from "@trpc/server"
import { eq, not, and } from "drizzle-orm"
import { nanoid } from "nanoid"
import { z } from "zod"
import { hostnames_router } from "@/api/routers/hostnames"

const default_worker_script = `
export default {
    async fetch(request, env) {
        return new Response("Hello, world!")
    }
}
`

export const workers_router = router({
    hostnames: hostnames_router,
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
                let content = module.value;
                let type = module.type;

                return {
                    id: module.id,
                    name: module.name,
                    content,
                    type
                }
            })

        return [entrypoint, ...modules]
    }),
})
