import { workers_router } from "@/api/routers/workers";
import { public_procedure, router } from "@/api/server";

export const appRouter = router({
    workers: workers_router
})

export type AppRouter = typeof appRouter;