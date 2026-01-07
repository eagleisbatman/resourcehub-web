import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { statuses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { name, color, order } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (order !== undefined) updateData.order = order;

    const [status] = await db.update(statuses)
      .set(updateData)
      .where(eq(statuses.id, params.id))
      .returning();

    if (!status) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Status not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: status });
  } catch (error: unknown) {
        if (err.code === "23505") {
      return NextResponse.json(
        { error: { code: "DUPLICATE", message: "Status name already exists" } },
        { status: 409 }
      );
    }
    console.error("Update status error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to update status" } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    await db.delete(statuses).where(eq(statuses.id, params.id));

    return NextResponse.json({ data: { success: true } });
  } catch (error: unknown) {
        console.error("Delete status error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to delete status" } },
      { status: 500 }
    );
  }
}
