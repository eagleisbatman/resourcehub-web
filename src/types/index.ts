import type {
  Status,
  Flag,
  Role,
  Project,
  Resource,
  Allocation,
  ResourceLeave,
} from "@/lib/db/schema";
import type { ResourceStatus } from "@/lib/resource-utils";

export type UserRole = "SUPER_ADMIN" | "ADMIN";
export type { Status, Flag, Role, Project, Resource, Allocation, ResourceLeave };

export type ProjectWithRelations = Project & {
  status: Status;
  flags: Flag[];
};

export type ResourceWithRole = Resource & {
  role: Role;
};

export type ResourceWithStatus = ResourceWithRole & {
  status: ResourceStatus;
  workloadPercent: number;
  currentProjects: Array<{ id: string; code: string; name: string; plannedHours: number }>;
  currentLeave: ResourceLeave | null;
  upcomingLeaves: ResourceLeave[];
};

export type ProjectWithResources = ProjectWithRelations & {
  allocatedResources: Array<{
    id: string;
    name: string;
    code: string;
    role: string;
    status: ResourceStatus;
    plannedHours: number;
  }>;
  resourceCount: number;
  totalPlannedHours: number;
};

export type AllocationWithRelations = Allocation & {
  project: Project & { status: Status };
  role: Role;
};

export type AllocationWithResources = AllocationWithRelations & {
  resources: Array<{ id: string; name: string; code: string }>;
};
