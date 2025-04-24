import { public_procedure, router } from "@/api/server";

export const appRouter = router({
    me: public_procedure.query(async ({ ctx }) => {
        return ctx
    })
})
export type AppRouter = typeof appRouter;