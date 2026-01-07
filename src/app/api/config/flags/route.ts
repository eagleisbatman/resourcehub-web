import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const flags = await prisma.flag.findMany({
      orderBy: {
        order: "asc",
      },
    });

    return NextResponse.json({ data: flags });
  } catch (error) {
    console.error("Get flags error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch flags" } },
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

    const flag = await prisma.flag.create({
      data: {
        name,
        color: color || "#6B7280",
        order: order || 0,
      },
    });

    return NextResponse.json({ data: flag });
  } catch (error: any) {
    if (error.code === "P2002") {
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

