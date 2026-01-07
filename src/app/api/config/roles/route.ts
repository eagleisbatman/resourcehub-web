import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const roles = await db.role.findMany({
      orderBy: {
        order: "asc",
      },
    });

    return NextResponse.json({ data: roles });
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

    const role = await db.role.create({
      data: {
        name,
        description,
        order: order || 0,
      },
    });

    return NextResponse.json({ data: role });
  } catch (error: any) {
    if (error.code === "P2002") {
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

