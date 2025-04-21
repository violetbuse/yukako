import { mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { nanoid } from "nanoid";

export const workers = mysqlTable("workers", {
    id: varchar("id", { length: 21 }).primaryKey().$defaultFn(() => nanoid()),
    user_id: text("user_id").notNull(),
    name: text("name").notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
})
