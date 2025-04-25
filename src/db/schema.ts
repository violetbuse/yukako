import { relations } from "drizzle-orm";
import { mysqlTable, text, timestamp, varchar, boolean, int, primaryKey } from "drizzle-orm/mysql-core";
import { nanoid } from "nanoid";

export const workers = mysqlTable("workers", {
    id: varchar("id", { length: 21 }).primaryKey().$defaultFn(() => nanoid()),
    owner_id: varchar("owner_id", { length: 255 }).notNull(),
    name: text("name").notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
    entrypoint: text("entrypoint").notNull(),
    compatibility_date: text("compatibility_date").notNull(),
})

export const workers_relations = relations(workers, ({ many }) => ({
    modules: many(modules),
    hostnames: many(hostnames),
}))

export const modules = mysqlTable("modules", {
    id: varchar("id", { length: 21 }).primaryKey().$defaultFn(() => nanoid()),
    worker_id: text("worker_id").notNull(),
    name: text("name").notNull(),
    es_module: text("es_module"),
    cjs_module: text("cjs_module"),
    text_module: text("text_module"),
    data_module: text("data_module_b64"),
    wasm_module: text("wasm_module_b64"),
    json_module: text("json_module"),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
})

export const modules_relations = relations(modules, ({ one }) => ({
    worker: one(workers, {
        fields: [modules.worker_id],
        references: [workers.id],
    }),
}))

export const hostnames = mysqlTable("hostnames", {
    id: varchar("id", { length: 21 }).primaryKey().$defaultFn(() => nanoid()),
    hostname: varchar("hostname", { length: 255 }).notNull(),
    worker_id: text("worker_id").notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
    verified: boolean("verified").notNull().default(false),
    verification_code: text("verification_code").notNull(),
})

export const hostnames_relations = relations(hostnames, ({ one }) => ({
    worker: one(workers, {
        fields: [hostnames.worker_id],
        references: [workers.id],
    }),
}))


