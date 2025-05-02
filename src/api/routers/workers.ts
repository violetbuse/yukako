import { user_procedure, worker_procedure } from "@/api/server"
import Dns2 from "dns2"
import { router } from "@/api/server"
import { db } from "@/db"
import { workers, hostnames, modules, deployments } from "@/db/schema"
import { TRPCError } from "@trpc/server"
import { eq, not, and, notInArray, desc } from "drizzle-orm"
import { nanoid } from "nanoid"
import { z } from "zod"
import { hostnames_router } from "@/api/routers/hostnames"
import { worker_package_schema, verify_worker_package, build_from_package, WorkerPackageFileType } from "@/lib/builder"

const default_worker_script = `
export default {
    async fetch(request, env) {
        return new Response("Hello, world!")
    }
}
`

export const workers_router = router({
    hostnames: hostnames_router,
    list: user_procedure.query(async ({ ctx }) => {

        const owner_id = ctx.organization_id ? ctx.organization_id : ctx.user_id

        const workers_list = await db.query.workers.findMany({
            where: eq(workers.owner_id, owner_id)
        })

        return workers_list.map((worker) => ({
            id: worker.id,
            name: worker.name
        }))
    }),
    new: user_procedure.input(z.object({
        name: z.string(),
    })).mutation(async ({ ctx, input }) => {

        const owner_id = ctx.organization_id ? ctx.organization_id : ctx.user_id


        const worker_id = nanoid()

        const new_worker = await db.insert(workers).values({
            id: worker_id,
            owner_id,
            name: input.name,
        })

        return worker_id
    }),
    upload_source_package: worker_procedure.input(z.object({
        worker_id: z.string(),
        package: worker_package_schema
    })).mutation(async ({ ctx, input }) => {
        return await db.transaction(async (tx) => {

            const worker_id = input.worker_id;
            const owner_id = ctx.organization_id ? ctx.organization_id : ctx.user_id

            const worker = await tx.query.workers.findFirst({
                where: and(eq(workers.id, worker_id), eq(workers.owner_id, owner_id))
            })

            if (!worker) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Worker not found" })
            }

            const valid_package = verify_worker_package(input.package)

            if (!valid_package) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid worker package" })
            }

            const previous_deployment = await tx.query.deployments.findFirst({
                where: eq(deployments.worker_id, worker_id),
                orderBy: desc(deployments.version)
            })

            const next_version = previous_deployment ? previous_deployment.version + 1 : 1

            let built_package: Awaited<ReturnType<typeof build_from_package>> | null = null

            try {
                built_package = await build_from_package(input.package)

            } catch (error) {
                if (error instanceof Error) {
                    const new_deployment = await tx.insert(deployments).values({
                        worker_id,
                        version: next_version,
                        compatibility_date: input.package.compatibility_date,
                        error: error.message
                    }).$returningId();

                    if (new_deployment.length === 0) {
                        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create deployment" })
                    }

                    return new_deployment[0].id
                }

                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to build worker package" })
            }

            const new_deployment = await tx.insert(deployments).values({
                worker_id,
                version: next_version,
                compatibility_date: input.package.compatibility_date,
                error: null
            }).$returningId();

            if (new_deployment.length === 0) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create deployment" })
            }

            const deployment_id = new_deployment[0].id

            await tx.insert(modules).values(built_package.files.map((file) => ({
                deployment_id,
                name: file.filename,
                type: file.type as WorkerPackageFileType,
                value: file.content
            })));

            await tx.insert(modules).values({
                deployment_id,
                name: "workerscript",
                type: "esm",
                value: built_package.entrypoint
            })

            return deployment_id
        });
    })
})
