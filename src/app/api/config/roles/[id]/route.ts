import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { name, description, order } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) updateData.order = order;

    const [role] = await db.update(roles)
      .set(updateData)
      .where(eq(roles.id, params.id))
      .returning();

    if (!role) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Role not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: role });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === "23505") {
      return NextResponse.json(
        { error: { code: "DUPLICATE", message: "Role name already exists" } },
        { status: 409 }
      );
    }
    console.error("Update role error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to update role" } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    await db.delete(roles).where(eq(roles.id, params.id));

    return NextResponse.json({ data: { success: true } });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error("Delete role error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to delete role" } },
      { status: 500 }
    );
  }
}
