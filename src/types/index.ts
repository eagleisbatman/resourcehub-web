import type { Status, Flag, Role, Project, Resource, Allocation } from "@/lib/db/schema";

export type UserRole = "SUPER_ADMIN" | "ADMIN";
export type { Status, Flag, Role, Project, Resource, Allocation };

export type ProjectWithRelations = Project & {
  status: Status;
  flags: Flag[];
};

export type ResourceWithRole = Resource & {
  role: Role;
};

export type AllocationWithRelations = Allocation & {
  project: Project & { status: Status };
  role: Role;
};
