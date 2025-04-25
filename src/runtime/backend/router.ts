import { db } from "@/db";
import { Router } from "express";
import { sql } from "drizzle-orm";

const router = Router();

router.post("/traffic/:worker_id", async (req, res) => {
    const data = req.body;

    const status = data.status;
    const track_traffic = data.track_traffic;

    res.status(200).send('').end();
})

export const yukako_backend_router = router;