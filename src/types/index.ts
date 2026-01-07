import type { UserRole as DrizzleUserRole, Status, Flag, Role, Project, Resource, Allocation } from "@/lib/db/schema";

export type UserRole = "SUPER_ADMIN" | "ADMIN";
export type { Status, Flag, Role, Project, Resource, Allocation };
