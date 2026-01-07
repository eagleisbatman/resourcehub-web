import { pgTable, text, boolean, integer, decimal, timestamp, jsonb, pgEnum, uniqueIndex, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export const userRoleEnum = pgEnum("user_role", ["SUPER_ADMIN", "ADMIN"]);

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("ADMIN"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const statuses = pgTable("statuses", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#6B7280"),
  order: integer("order").notNull().default(0),
});

export const flags = pgTable("flags", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#6B7280"),
  order: integer("order").notNull().default(0),
});

export const roles = pgTable("roles", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull().unique(),
  description: text("description"),
  order: integer("order").notNull().default(0),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isOngoing: boolean("is_ongoing").notNull().default(false),
  statusId: text("status_id").notNull().references(() => statuses.id),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const projectFlags = pgTable("project_flags", {
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  flagId: text("flag_id").notNull().references(() => flags.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: uniqueIndex("project_flags_pk").on(table.projectId, table.flagId),
}));

export const resources = pgTable("resources", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  roleId: text("role_id").notNull().references(() => roles.id),
  specialization: text("specialization"),
  availability: integer("availability").notNull().default(100),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const allocations = pgTable("allocations", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  roleId: text("role_id").notNull().references(() => roles.id),
  resourceIds: jsonb("resource_ids").$type<string[]>().notNull().default([]),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  week: integer("week").notNull(),
  plannedHours: decimal("planned_hours", { precision: 5, scale: 1 }).notNull().default("0"),
  actualHours: decimal("actual_hours", { precision: 5, scale: 1 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  uniqueAllocation: uniqueIndex("allocations_unique").on(
    table.projectId,
    table.roleId,
    table.year,
    table.month,
    table.week
  ),
  yearMonthIndex: index("allocations_year_month_idx").on(table.year, table.month),
}));

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires").notNull(),
}, (table) => ({
  pk: uniqueIndex("verification_tokens_pk").on(table.identifier, table.token),
}));

// Relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  status: one(statuses, { fields: [projects.statusId], references: [statuses.id] }),
  flags: many(projectFlags),
  allocations: many(allocations),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  role: one(roles, { fields: [resources.roleId], references: [roles.id] }),
}));

export const allocationsRelations = relations(allocations, ({ one }) => ({
  project: one(projects, { fields: [allocations.projectId], references: [projects.id] }),
  role: one(roles, { fields: [allocations.roleId], references: [roles.id] }),
}));

export const projectFlagsRelations = relations(projectFlags, ({ one }) => ({
  project: one(projects, { fields: [projectFlags.projectId], references: [projects.id] }),
  flag: one(flags, { fields: [projectFlags.flagId], references: [flags.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
export type Allocation = typeof allocations.$inferSelect;
export type NewAllocation = typeof allocations.$inferInsert;
export type Status = typeof statuses.$inferSelect;
export type Flag = typeof flags.$inferSelect;
export type Role = typeof roles.$inferSelect;

