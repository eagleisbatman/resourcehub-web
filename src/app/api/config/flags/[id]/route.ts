import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-utils";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { name, color, order } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (order !== undefined) updateData.order = order;

    const flag = await prisma.flag.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ data: flag });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: { code: "DUPLICATE", message: "Flag name already exists" } },
        { status: 409 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Flag not found" } },
        { status: 404 }
      );
    }
    console.error("Update flag error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to update flag" } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    await prisma.flag.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Flag not found" } },
        { status: 404 }
      );
    }
    console.error("Delete flag error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to delete flag" } },
      { status: 500 }
    );
  }
}

