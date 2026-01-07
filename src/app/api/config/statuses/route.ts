import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { statuses } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const statusesList = await db.select().from(statuses).orderBy(asc(statuses.order));

    return NextResponse.json({ data: statusesList });
  } catch (error) {
    console.error("Get statuses error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch statuses" } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { name, color, order } = body;

    if (!name) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Name is required" } },
        { status: 400 }
      );
    }

    const [status] = await db.insert(statuses).values({
      name,
      color: color || "#6B7280",
      order: order || 0,
    }).returning();

    return NextResponse.json({ data: status });
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: { code: "DUPLICATE", message: "Status name already exists" } },
        { status: 409 }
      );
    }
    console.error("Create status error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to create status" } },
      { status: 500 }
    );
  }
}
