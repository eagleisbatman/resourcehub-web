import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const resource = await prisma.resource.findUnique({
      where: { id: params.id },
      include: {
        role: true,
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Resource not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: resource });
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

    const updateData: any = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (roleId !== undefined) updateData.roleId = roleId;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (availability !== undefined) updateData.availability = availability;
    if (isActive !== undefined) updateData.isActive = isActive;

    const resource = await prisma.resource.update({
      where: { id: params.id },
      data: updateData,
      include: {
        role: true,
      },
    });

    return NextResponse.json({ data: resource });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: { code: "DUPLICATE", message: "Resource code already exists" } },
        { status: 409 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Resource not found" } },
        { status: 404 }
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

    await prisma.resource.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Resource not found" } },
        { status: 404 }
      );
    }
    console.error("Delete resource error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to delete resource" } },
      { status: 500 }
    );
  }
}

