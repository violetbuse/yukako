import { public_procedure } from "@/api/server";
import { router } from "@/api/server";

export const stats_router = router({
    get_stats_last_month: public_procedure.query(async ({ ctx }) => {
        return {}
    })
})
