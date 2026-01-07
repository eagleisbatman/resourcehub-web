import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const rolesList = await db.select().from(roles).orderBy(asc(roles.order));

    return NextResponse.json({ data: rolesList });
  } catch (error) {
    console.error("Get roles error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch roles" } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { name, description, order } = body;

    if (!name) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Name is required" } },
        { status: 400 }
      );
    }

    const [role] = await db.insert(roles).values({
      name,
      description,
      order: order || 0,
    }).returning();

    return NextResponse.json({ data: role });
  } catch (error: unknown) {
        if (err.code === "23505") {
      return NextResponse.json(
        { error: { code: "DUPLICATE", message: "Role name already exists" } },
        { status: 409 }
      );
    }
    console.error("Create role error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to create role" } },
      { status: 500 }
    );
  }
}
