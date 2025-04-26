import { db } from "@/db";
import { Router } from "express";
import { sql } from "drizzle-orm";

const router = Router();

router.post("/traffic/:worker_id", async (req, res) => {
    const status = parseInt(req.body);

    const worker_id = req.params.worker_id;
    console.log(`[${worker_id}] ${status}`);

    res.status(200).send('').end();
})

export const yukako_backend_router = router;