import { relations } from "drizzle-orm";
import { mysqlTable, text, timestamp, varchar, boolean, int, primaryKey, unique } from "drizzle-orm/mysql-core";
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
    deployments: many(deployments),
    hostnames: many(hostnames),
}))

export const deployments = mysqlTable("deployments", {
    id: varchar("id", { length: 21 }).primaryKey().$defaultFn(() => nanoid()),
    worker_id: text("worker_id").notNull(),
    version: int("version").notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
    compatibility_date: text("compatibility_date").notNull(),
}, table => [
    unique().on(table.worker_id, table.version)
])

export const deployments_relations = relations(deployments, ({ one, many }) => ({
    worker: one(workers, {
        fields: [deployments.worker_id],
        references: [workers.id],
    }),
    modules: many(modules),
}))

export const modules = mysqlTable("modules", {
    id: varchar("id", { length: 21 }).primaryKey().$defaultFn(() => nanoid()),
    deployment_id: text("deployment_id").notNull(),
    entrypoint: boolean("entrypoint").notNull().default(false),
    name: text("name").notNull(),
    type: text("type", { enum: ["esm"] }).notNull(),
    value: text("value").notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
})

export const modules_relations = relations(modules, ({ one }) => ({
    deployment: one(deployments, {
        fields: [modules.deployment_id],
        references: [deployments.id],
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
