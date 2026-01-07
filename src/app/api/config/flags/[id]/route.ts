import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { flags } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const body = await req.json();
    const { name, color, order } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (order !== undefined) updateData.order = order;

    const [flag] = await db.update(flags)
      .set(updateData)
      .where(eq(flags.id, params.id))
      .returning();

    if (!flag) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Flag not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: flag });
  } catch (error: unknown) {
    const err = error as { code?: string };
    const err = error as { code?: string };
    if (err.code === "23505") {
      return NextResponse.json(
        { error: { code: "DUPLICATE", message: "Flag name already exists" } },
        { status: 409 }
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
    const authError = await requireAuth();
    if (authError) return authError;

    await db.delete(flags).where(eq(flags.id, params.id));

    return NextResponse.json({ data: { success: true } });
  } catch (error: unknown) {
    const err = error as { code?: string };
        console.error("Delete flag error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to delete flag" } },
      { status: 500 }
    );
  }
}
