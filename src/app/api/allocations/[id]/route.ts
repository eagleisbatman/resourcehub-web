import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const allocation = await db.allocation.findUnique({
      where: { id: params.id },
      include: {
        project: {
          include: {
            status: true,
          },
        },
        role: true,
      },
    });

    if (!allocation) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Allocation not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: allocation });
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
    if (plannedHours !== undefined) updateData.plannedHours = parseFloat(plannedHours);
    if (actualHours !== undefined) updateData.actualHours = parseFloat(actualHours);
    if (notes !== undefined) updateData.notes = notes;

    const allocation = await db.allocation.update({
      where: { id: params.id },
      data: updateData,
      include: {
        project: {
          include: {
            status: true,
          },
        },
        role: true,
      },
    });

    return NextResponse.json({ data: allocation });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Allocation not found" } },
        { status: 404 }
      );
    }
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

    await db.allocation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Allocation not found" } },
        { status: 404 }
      );
    }
    console.error("Delete allocation error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to delete allocation" } },
      { status: 500 }
    );
  }
}

