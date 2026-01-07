import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/api-utils";
import { UserRole } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireSuperAdmin(req);
    if (authError) return authError;

    const body = await req.json();
    const { role, isActive } = body;

    const updateData: any = {};
    if (role !== undefined) {
      if (!Object.values(UserRole).includes(role)) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "Invalid role" } },
          { status: 400 }
        );
      }
      updateData.role = role;
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ data: user });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to update user" } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireSuperAdmin(req);
    if (authError) return authError;

    await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }
    console.error("Deactivate user error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to deactivate user" } },
      { status: 500 }
    );
  }
}

