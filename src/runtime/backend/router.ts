import { db } from "@/db";
import { Router } from "express";
import { slotted_counters } from "@/db/schema";
import { sql } from "drizzle-orm";

const router = Router();

router.post("/traffic/:worker_id", async (req, res) => {
    const data = req.body;

    const status = data.status;

    if (data && data.track_traffic === true && data.status) {
        const current_date = new Date();
        const year = current_date.getUTCFullYear();
        const month = current_date.getUTCMonth();
        const day = current_date.getUTCDate();
        const hour = current_date.getUTCHours();

        // random number between 1 and 3
        const slot = Math.floor(Math.random() * 3) + 1;

        await db.insert(slotted_counters).values({
            record_type: "worker_traffic",
            record_id: req.params.worker_id,
            record_secondary_id: status.toString(),
            slot,
            count: 1,
            year,
            month,
            day,
            hour
        }).onDuplicateKeyUpdate({
            set: {
                count: sql`${slotted_counters.count} + 1`
            }
        });
    }

    res.status(200).send('').end();
})

export const yukako_backend_router = router;