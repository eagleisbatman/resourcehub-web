import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, statuses, projectFlags, flags } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";

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

    return NextResponse.json({
      data: {
        ...projectResult.project,
        status: projectResult.status,
        flags: projectFlagsList.map((pf) => pf.flag),
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
  } catch (error: unknown) {
        console.error("Delete project error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to delete project" } },
      { status: 500 }
    );
  }
}
