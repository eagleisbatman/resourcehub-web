import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { allocations, projects, statuses, roles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const [result] = await db
      .select({
        allocation: allocations,
        project: projects,
        status: statuses,
        role: roles,
      })
      .from(allocations)
      .innerJoin(projects, eq(allocations.projectId, projects.id))
      .innerJoin(statuses, eq(projects.statusId, statuses.id))
      .innerJoin(roles, eq(allocations.roleId, roles.id))
      .where(eq(allocations.id, params.id))
      .limit(1);

    if (!result) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Allocation not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        ...result.allocation,
        project: {
          ...result.project,
          status: result.status,
        },
        role: result.role,
      },
    });
  } catch (error) {
    console.error("Get allocation error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch allocation" } },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { resourceIds, plannedHours, actualHours, notes } = body;

    const updateData: any = {};
    if (resourceIds !== undefined) updateData.resourceIds = resourceIds;
    if (plannedHours !== undefined) updateData.plannedHours = String(plannedHours);
    if (actualHours !== undefined) updateData.actualHours = String(actualHours);
    if (notes !== undefined) updateData.notes = notes;

    const [allocation] = await db.update(allocations)
      .set(updateData)
      .where(eq(allocations.id, params.id))
      .returning();

    if (!allocation) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Allocation not found" } },
        { status: 404 }
      );
    }

    const [projectResult] = await db
      .select({ project: projects, status: statuses })
      .from(projects)
      .innerJoin(statuses, eq(projects.statusId, statuses.id))
      .where(eq(projects.id, allocation.projectId))
      .limit(1);

    const [role] = await db.select().from(roles).where(eq(roles.id, allocation.roleId)).limit(1);

    return NextResponse.json({
      data: {
        ...allocation,
        project: {
          ...projectResult?.project,
          status: projectResult?.status,
        },
        role,
      },
    });
  } catch (error: any) {
    console.error("Update allocation error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to update allocation" } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    await db.delete(allocations).where(eq(allocations.id, params.id));

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    console.error("Delete allocation error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to delete allocation" } },
      { status: 500 }
    );
  }
}
