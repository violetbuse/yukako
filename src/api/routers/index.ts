import { router } from "@/api/server";
import { user_router } from "@/api/routers/user";
import { organization_router } from "@/api/routers/organization";

export const appRouter = router({
    user: user_router,
    organization: organization_router,
})

export type AppRouter = typeof appRouter;