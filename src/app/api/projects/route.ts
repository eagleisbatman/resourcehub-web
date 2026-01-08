import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, statuses, projectFlags, flags, allocations, resources, roles, resourceLeaves } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";
import { getResourceStatus } from "@/lib/resource-utils";

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const searchParams = req.nextUrl.searchParams;
    const isArchived = searchParams.get("archived") === "true";
    const statusId = searchParams.get("statusId");

    const whereConditions = [eq(projects.isArchived, isArchived)];
    if (statusId) {
      whereConditions.push(eq(projects.statusId, statusId));
    }

    const projectsList = await db
      .select({
        project: projects,
        status: statuses,
      })
      .from(projects)
      .innerJoin(statuses, eq(projects.statusId, statuses.id))
      .where(and(...whereConditions))
      .orderBy(desc(projects.createdAt));

    const projectFlagsList = await db
      .select()
      .from(projectFlags)
      .innerJoin(flags, eq(projectFlags.flagId, flags.id));

    const flagsMap = new Map<string, typeof flags.$inferSelect[]>();
    projectFlagsList.forEach((pf) => {
      if (!flagsMap.has(pf.project_flags.projectId)) {
        flagsMap.set(pf.project_flags.projectId, []);
      }
      flagsMap.get(pf.project_flags.projectId)!.push(pf.flags);
    });

    // Get current month allocations
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const allAllocations = await db
      .select()
      .from(allocations)
      .where(
        and(
          eq(allocations.year, currentYear),
          eq(allocations.month, currentMonth)
        )
      );

    // Get all resources and roles
    const allResources = await db
      .select({
        resource: resources,
        role: roles,
      })
      .from(resources)
      .innerJoin(roles, eq(resources.roleId, roles.id));

    // Get all leaves for status calculation
    const allLeaves = await db.select().from(resourceLeaves);

    const result = projectsList.map((p) => {
      const project = p.project;
      const projectAllocations = allAllocations.filter(
        (alloc) => alloc.projectId === project.id
      );

      // Extract unique resource IDs from allocations
      const resourceIdSet = new Set<string>();
      projectAllocations.forEach((alloc) => {
        alloc.resourceIds.forEach((id) => resourceIdSet.add(id));
      });

      // Get resource details
      const allocatedResources = Array.from(resourceIdSet)
        .map((resourceId) => {
          const resourceData = allResources.find(
            (r) => r.resource.id === resourceId
          );
          if (!resourceData) return null;

          const resourceAllocations = allAllocations.filter(
            (alloc) =>
              alloc.resourceIds.includes(resourceId) &&
              alloc.projectId === project.id
          );

          const resourceLeavesList = allLeaves.filter(
            (leave) => leave.resourceId === resourceId
          );

          const status = getResourceStatus(
            resourceData.resource,
            resourceAllocations,
            resourceLeavesList
          );

          const plannedHours = resourceAllocations.reduce(
            (sum, alloc) => sum + Number(alloc.plannedHours),
            0
          );

          return {
            id: resourceData.resource.id,
            name: resourceData.resource.name,
            code: resourceData.resource.code,
            role: resourceData.role.name,
            status,
            plannedHours: Math.round(plannedHours * 10) / 10,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      const totalPlannedHours = projectAllocations.reduce(
        (sum, alloc) => sum + Number(alloc.plannedHours),
        0
      );

      return {
        ...project,
        status: p.status,
        flags: flagsMap.get(project.id) || [],
        allocatedResources,
        resourceCount: allocatedResources.length,
        totalPlannedHours: Math.round(totalPlannedHours * 10) / 10,
      };
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch projects" } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { code, name, description, startDate, endDate, isOngoing, statusId, flagIds } = body;

    if (!code || !name || !statusId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Missing required fields" } },
        { status: 400 }
      );
    }

    const [project] = await db.insert(projects).values({
      code,
      name,
      description,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      isOngoing: isOngoing || false,
      statusId,
    }).returning();

    if (flagIds && flagIds.length > 0) {
      await db.insert(projectFlags).values(
        flagIds.map((flagId: string) => ({
          projectId: project.id,
          flagId,
        }))
      );
    }

    const [status] = await db.select().from(statuses).where(eq(statuses.id, project.statusId)).limit(1);
    const projectFlagsList = await db
      .select({ flag: flags })
      .from(projectFlags)
      .innerJoin(flags, eq(projectFlags.flagId, flags.id))
      .where(eq(projectFlags.projectId, project.id));

    return NextResponse.json({
      data: {
        ...project,
        status,
        flags: projectFlagsList.map((pf) => pf.flag),
      },
    });
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === "23505") {
      return NextResponse.json(
        { error: { code: "DUPLICATE", message: "Project code already exists" } },
        { status: 409 }
      );
    }
    console.error("Create project error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to create project" } },
      { status: 500 }
    );
  }
}
