import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resources, roles, allocations, projects, resourceLeaves, statuses } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";
import {
  getResourceStatus,
  getWorkloadPercent,
  getCurrentProjects,
} from "@/lib/resource-utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const [result] = await db
      .select({
        resource: resources,
        role: roles,
      })
      .from(resources)
      .innerJoin(roles, eq(resources.roleId, roles.id))
      .where(eq(resources.id, params.id))
      .limit(1);

    if (!result) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Resource not found" } },
        { status: 404 }
      );
    }

    // Get all allocations for this resource
    const resourceAllocations = await db
      .select({
        allocation: allocations,
        project: projects,
        status: statuses,
      })
      .from(allocations)
      .innerJoin(projects, eq(allocations.projectId, projects.id))
      .innerJoin(statuses, eq(projects.statusId, statuses.id))
      .where(sql`${allocations.resourceIds}::jsonb @> ${JSON.stringify([params.id])}::jsonb`);

    // Get all leaves for this resource
    const resourceLeavesList = await db
      .select()
      .from(resourceLeaves)
      .where(eq(resourceLeaves.resourceId, params.id))
      .orderBy(resourceLeaves.startDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentLeave =
      resourceLeavesList.find((leave) => {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        return startDate <= today && endDate >= today;
      }) || null;

    const upcomingLeaves = resourceLeavesList.filter((leave) => {
      const startDate = new Date(leave.startDate);
      startDate.setHours(0, 0, 0, 0);
      return startDate > today;
    });

    const status = getResourceStatus(
      result.resource,
      resourceAllocations.map((a) => a.allocation),
      resourceLeavesList
    );
    const workloadPercent = getWorkloadPercent(
      result.resource,
      resourceAllocations.map((a) => a.allocation)
    );

    const allProjects = resourceAllocations.map((a) => ({
      id: a.project.id,
      code: a.project.code,
      name: a.project.name,
    }));
    const currentProjectsList = getCurrentProjects(
      result.resource,
      resourceAllocations.map((a) => a.allocation),
      allProjects
    );

    // Create allocation breakdown by project
    const projectBreakdown = resourceAllocations.reduce((acc, item) => {
      const projectId = item.allocation.projectId;
      if (!acc[projectId]) {
        acc[projectId] = {
          project: {
            ...item.project,
            status: item.status,
          },
          planned: 0,
          actual: 0,
        };
      }
      acc[projectId].planned += Number(item.allocation.plannedHours);
      acc[projectId].actual += Number(item.allocation.actualHours);
      return acc;
    }, {} as Record<string, { project: typeof projects.$inferSelect & { status: typeof statuses.$inferSelect }; planned: number; actual: number }>);

    return NextResponse.json({
      data: {
        ...result.resource,
        role: result.role,
        status,
        workloadPercent,
        currentProjects: currentProjectsList,
        currentLeave,
        upcomingLeaves,
        leaveHistory: resourceLeavesList,
        allocationBreakdown: Object.values(projectBreakdown).map((item) => ({
          project: item.project,
          planned: Math.round(item.planned * 10) / 10,
          actual: Math.round(item.actual * 10) / 10,
        })),
      },
    });
  } catch (error) {
    console.error("Get resource error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch resource" } },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { code, name, email, roleId, specialization, availability, isActive } = body;

    const updateData: Record<string, unknown> = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (roleId !== undefined) updateData.roleId = roleId;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (availability !== undefined) updateData.availability = availability;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [resource] = await db.update(resources)
      .set(updateData)
      .where(eq(resources.id, params.id))
      .returning();

    if (!resource) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Resource not found" } },
        { status: 404 }
      );
    }

    const [role] = await db.select().from(roles).where(eq(roles.id, resource.roleId)).limit(1);

    return NextResponse.json({
      data: {
        ...resource,
        role,
      },
    });
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === "23505") {
      return NextResponse.json(
        { error: { code: "DUPLICATE", message: "Resource code already exists" } },
        { status: 409 }
      );
    }
    console.error("Update resource error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to update resource" } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    await db.delete(resources).where(eq(resources.id, params.id));

    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to delete resource" } },
      { status: 500 }
    );
  }
}
