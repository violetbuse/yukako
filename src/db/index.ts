import 'dotenv/config';
import { drizzle } from "drizzle-orm/mysql2"
import * as schema from "./schema"

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
}

export const db = drizzle(process.env.DATABASE_URL!, { schema, mode: "default" });