import { router } from "@/api/server";
import { user_router } from "@/api/routers/user";

export const appRouter = router({
    user: user_router
})

export type AppRouter = typeof appRouter;