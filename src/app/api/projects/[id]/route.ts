import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, statuses, projectFlags, flags, allocations, resources, roles, resourceLeaves } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";
import { getResourceStatus } from "@/lib/resource-utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const [projectResult] = await db
      .select({
        project: projects,
        status: statuses,
      })
      .from(projects)
      .innerJoin(statuses, eq(projects.statusId, statuses.id))
      .where(eq(projects.id, params.id))
      .limit(1);

    if (!projectResult) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Project not found" } },
        { status: 404 }
      );
    }

    const projectFlagsList = await db
      .select({ flag: flags })
      .from(projectFlags)
      .innerJoin(flags, eq(projectFlags.flagId, flags.id))
      .where(eq(projectFlags.projectId, params.id));

    // Get current month allocations
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const projectAllocations = await db
      .select()
      .from(allocations)
      .where(
        and(
          eq(allocations.projectId, params.id),
          eq(allocations.year, currentYear),
          eq(allocations.month, currentMonth)
        )
      );

    // Extract unique resource IDs
    const resourceIdSet = new Set<string>();
    projectAllocations.forEach((alloc) => {
      alloc.resourceIds.forEach((id) => resourceIdSet.add(id));
    });

    // Get resource details
    const allResources = await db
      .select({
        resource: resources,
        role: roles,
      })
      .from(resources)
      .innerJoin(roles, eq(resources.roleId, roles.id))
      .where(sql`${resources.id} = ANY(${Array.from(resourceIdSet)})`);

    // Get all leaves
    const allLeaves = await db.select().from(resourceLeaves);

    const allocatedResources = Array.from(resourceIdSet)
      .map((resourceId) => {
        const resourceData = allResources.find(
          (r) => r.resource.id === resourceId
        );
        if (!resourceData) return null;

        const resourceAllocations = projectAllocations.filter(
          (alloc) => alloc.resourceIds.includes(resourceId)
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
        const actualHours = resourceAllocations.reduce(
          (sum, alloc) => sum + Number(alloc.actualHours),
          0
        );

        return {
          id: resourceData.resource.id,
          name: resourceData.resource.name,
          code: resourceData.resource.code,
          role: resourceData.role.name,
          status,
          plannedHours: Math.round(plannedHours * 10) / 10,
          actualHours: Math.round(actualHours * 10) / 10,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    const totalPlannedHours = projectAllocations.reduce(
      (sum, alloc) => sum + Number(alloc.plannedHours),
      0
    );
    const totalActualHours = projectAllocations.reduce(
      (sum, alloc) => sum + Number(alloc.actualHours),
      0
    );

    return NextResponse.json({
      data: {
        ...projectResult.project,
        status: projectResult.status,
        flags: projectFlagsList.map((pf) => pf.flag),
        allocatedResources,
        resourceCount: allocatedResources.length,
        totalPlannedHours: Math.round(totalPlannedHours * 10) / 10,
        totalActualHours: Math.round(totalActualHours * 10) / 10,
      },
    });
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch project" } },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { code, name, description, startDate, endDate, isOngoing, statusId, flagIds, isArchived } = body;

    const [existingProject] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, params.id))
      .limit(1);

    if (!existingProject) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Project not found" } },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (isOngoing !== undefined) updateData.isOngoing = isOngoing;
    if (statusId !== undefined) updateData.statusId = statusId;
    if (isArchived !== undefined) updateData.isArchived = isArchived;

    const [project] = await db.update(projects)
      .set(updateData)
      .where(eq(projects.id, params.id))
      .returning();

    if (flagIds !== undefined) {
      await db.delete(projectFlags).where(eq(projectFlags.projectId, params.id));
      if (flagIds.length > 0) {
        await db.insert(projectFlags).values(
          flagIds.map((flagId: string) => ({
            projectId: params.id,
            flagId,
          }))
        );
      }
    }

    const [status] = await db.select().from(statuses).where(eq(statuses.id, project.statusId)).limit(1);
    const projectFlagsList = await db
      .select({ flag: flags })
      .from(projectFlags)
      .innerJoin(flags, eq(projectFlags.flagId, flags.id))
      .where(eq(projectFlags.projectId, params.id));

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
    console.error("Update project error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to update project" } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    await db.delete(projects).where(eq(projects.id, params.id));

    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to delete project" } },
      { status: 500 }
    );
  }
}
