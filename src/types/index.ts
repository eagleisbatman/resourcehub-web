import { UserRole, Status, Flag, Role, Project, Resource, Allocation } from "@prisma/client";

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

