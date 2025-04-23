import { relations } from "drizzle-orm";
import { mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { nanoid } from "nanoid";

export const users = mysqlTable("users", {
    id: varchar("id", { length: 255 }).primaryKey(),
    email: text("email").notNull(),
    first_name: text("first_name"),
    last_name: text("last_name"),
    pfp_url: text("pfp_url"),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
    deleted_at: timestamp("deleted_at"),
})

export const userRelations = relations(users, ({ many }) => ({
    organization_memberships: many(organization_memberships),
}))

export const organizations = mysqlTable("organizations", {
    id: varchar("id", { length: 255 }).primaryKey(),
    name: text("name").notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
    deleted_at: timestamp("deleted_at"),
})

export const organizationRelations = relations(organizations, ({ many }) => ({
    organization_memberships: many(organization_memberships),
}))

export const organization_memberships = mysqlTable("organization_memberships", {
    id: varchar("id", { length: 255 }).primaryKey(),
    user_id: varchar("user_id", { length: 255 }).notNull(),
    organization_id: varchar("organization_id", { length: 255 }).notNull(),
    role_slug: varchar("role_slug", { length: 255 }).notNull(),
    status: varchar("status", { length: 255, enum: ['pending', 'active', 'inactive'] }).notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
    deleted_at: timestamp("deleted_at"),
})

export const organization_membershipRelations = relations(organization_memberships, ({ one }) => ({
    user: one(users, {
        fields: [organization_memberships.user_id],
        references: [users.id],
    }),
    organization: one(organizations, {
        fields: [organization_memberships.organization_id],
        references: [organizations.id],
    }),
}))

export const workers = mysqlTable("workers", {
    id: varchar("id", { length: 21 }).primaryKey().$defaultFn(() => nanoid()),
    organization_id: varchar("organization_id", { length: 255 }).notNull(),
    name: text("name").notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
    entrypoint: text("entrypoint").notNull(),
    compatibility_date: text("compatibility_date").notNull(),
})

export const workers_relations = relations(workers, ({ many, one }) => ({
    modules: many(modules),
    hostnames: many(hostnames),
    organization: one(organizations, {
        fields: [workers.organization_id],
        references: [organizations.id],
    }),
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
    hostname: varchar("hostname", { length: 255 }).primaryKey(),
    worker_id: text("worker_id").notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
})

export const hostnames_relations = relations(hostnames, ({ one }) => ({
    worker: one(workers, {
        fields: [hostnames.worker_id],
        references: [workers.id],
    }),
}))



