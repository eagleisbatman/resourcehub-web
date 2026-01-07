import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSuperAdmin } from "@/lib/api-utils";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireSuperAdmin();
    if (authError) return authError;

    const body = await req.json();
    const { role, isActive } = body;

    const updateData: Record<string, unknown> = {};
    if (role !== undefined) {
      if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "Invalid role" } },
          { status: 400 }
        );
      }
      updateData.role = role;
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    const [user] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, params.id))
      .returning();

    if (!user) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: user });
  } catch (error: unknown) {
        console.error("Update user error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to update user" } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireSuperAdmin();
    if (authError) return authError;

    const [user] = await db.update(users)
      .set({ isActive: false })
      .where(eq(users.id, params.id))
      .returning();

    if (!user) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error: unknown) {
        console.error("Deactivate user error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to deactivate user" } },
      { status: 500 }
    );
  }
}
