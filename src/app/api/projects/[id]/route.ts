import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const project = await db.project.findUnique({
      where: { id: params.id },
      include: {
        status: true,
        flags: {
          include: {
            flag: true,
          },
        },
        allocations: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Project not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        ...project,
        flags: project.flags.map((pf) => pf.flag),
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

    const existingProject = await db.project.findUnique({
      where: { id: params.id },
      include: { flags: true },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Project not found" } },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (isOngoing !== undefined) updateData.isOngoing = isOngoing;
    if (statusId !== undefined) updateData.statusId = statusId;
    if (isArchived !== undefined) updateData.isArchived = isArchived;

    const project = await db.project.update({
      where: { id: params.id },
      data: {
        ...updateData,
        ...(flagIds !== undefined && {
          flags: {
            deleteMany: {},
            create: flagIds.map((flagId: string) => ({ flagId })),
          },
        }),
      },
      include: {
        status: true,
        flags: {
          include: {
            flag: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: {
        ...project,
        flags: project.flags.map((pf) => pf.flag),
      },
    });
  } catch (error: any) {
    if (error.code === "P2002") {
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

    await db.project.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Project not found" } },
        { status: 404 }
      );
    }
    console.error("Delete project error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to delete project" } },
      { status: 500 }
    );
  }
}

