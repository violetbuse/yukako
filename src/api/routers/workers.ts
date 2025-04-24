import { public_procedure } from "@/api/server"
import { router } from "@/api/server"
import { db } from "@/db"
import { workers } from "@/db/schema"
import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { z } from "zod"

const default_worker_script = `
export default {
    async fetch(request, env) {
        return new Response("Hello, world!")
    }
}
`

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
    })
})
