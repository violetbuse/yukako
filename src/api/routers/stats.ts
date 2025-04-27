import { worker_procedure } from "@/api/server";
import { router } from "@/api/server";

export const stats_router = router({
    get_stats_last_month: worker_procedure.query(async ({ ctx }) => {
        return {}
    })
})
