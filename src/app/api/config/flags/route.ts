import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { flags } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";

export async function GET() {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const flagsList = await db.select().from(flags).orderBy(asc(flags.order));

    return NextResponse.json({ data: flagsList });
  } catch (error) {
    console.error("Get flags error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch flags" } },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const body = await req.json();
    const { name, color, order } = body;

    if (!name) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Name is required" } },
        { status: 400 }
      );
    }

    const [flag] = await db.insert(flags).values({
      name,
      color: color || "#6B7280",
      order: order || 0,
    }).returning();

    return NextResponse.json({ data: flag });
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === "23505") {
      return NextResponse.json(
        { error: { code: "DUPLICATE", message: "Flag name already exists" } },
        { status: 409 }
      );
    }
    console.error("Create flag error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to create flag" } },
      { status: 500 }
    );
  }
}
