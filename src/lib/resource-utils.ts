import type { Resource, Allocation, ResourceLeave } from "@/lib/db/schema";

export type ResourceStatus = "available" | "working" | "on_leave";

export function getResourceStatus(
  resource: Resource,
  allocations: Allocation[],
  leaves: ResourceLeave[]
): ResourceStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if on leave today
  const activeLeave = leaves.find((leave) => {
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    return startDate <= today && endDate >= today;
  });

  if (activeLeave) {
    return "on_leave";
  }

  // Check if has allocations for current month
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const hasAllocations = allocations.some(
    (alloc) =>
      alloc.resourceIds.includes(resource.id) &&
      alloc.year === currentYear &&
      alloc.month === currentMonth &&
      Number(alloc.plannedHours) > 0
  );

  return hasAllocations ? "working" : "available";
}

export function getWorkloadPercent(
  resource: Resource,
  allocations: Allocation[]
): number {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  // Get all allocations for this resource this month
  const monthlyAllocations = allocations.filter(
    (alloc) =>
      alloc.resourceIds.includes(resource.id) &&
      alloc.year === currentYear &&
      alloc.month === currentMonth
  );

  const totalPlannedHours = monthlyAllocations.reduce(
    (sum, alloc) => sum + Number(alloc.plannedHours),
    0
  );

  // Calculate capacity (availability% × 40 hours × 4 weeks)
  const monthlyCapacity = (resource.availability / 100) * 40 * 4;

  if (monthlyCapacity === 0) return 0;

  return Math.round((totalPlannedHours / monthlyCapacity) * 100);
}

export function getCurrentProjects(
  resource: Resource,
  allocations: Allocation[],
  projects: Array<{ id: string; code: string; name: string }>
): Array<{ id: string; code: string; name: string; plannedHours: number }> {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const monthlyAllocations = allocations.filter(
    (alloc) =>
      alloc.resourceIds.includes(resource.id) &&
      alloc.year === currentYear &&
      alloc.month === currentMonth &&
      Number(alloc.plannedHours) > 0
  );

  const projectMap = new Map<
    string,
    { id: string; code: string; name: string; plannedHours: number }
  >();

  monthlyAllocations.forEach((alloc) => {
    const project = projects.find((p) => p.id === alloc.projectId);
    if (project) {
      const existing = projectMap.get(project.id);
      if (existing) {
        existing.plannedHours += Number(alloc.plannedHours);
      } else {
        projectMap.set(project.id, {
          ...project,
          plannedHours: Number(alloc.plannedHours),
        });
      }
    }
  });

  return Array.from(projectMap.values());
}

export function isResourceOnLeave(
  resource: Resource,
  leaves: ResourceLeave[],
  date?: Date
): boolean {
  const checkDate = date || new Date();
  checkDate.setHours(0, 0, 0, 0);

  return leaves.some((leave) => {
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    return (
      leave.resourceId === resource.id &&
      startDate <= checkDate &&
      endDate >= checkDate
    );
  });
}
