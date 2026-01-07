import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const searchParams = req.nextUrl.searchParams;
    const isActive = searchParams.get("active") !== "false";
    const roleId = searchParams.get("roleId");

    const resources = await db.resource.findMany({
      where: {
        isActive,
        ...(roleId && { roleId }),
      },
      include: {
        role: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ data: resources });
  } catch (error) {
    console.error("Get resources error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch resources" } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { code, name, email, roleId, specialization, availability } = body;

    if (!code || !name || !roleId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Missing required fields" } },
        { status: 400 }
      );
    }

    const resource = await db.resource.create({
      data: {
        code,
        name,
        email,
        roleId,
        specialization,
        availability: availability ?? 100,
      },
      include: {
        role: true,
      },
    });

    return NextResponse.json({ data: resource });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: { code: "DUPLICATE", message: "Resource code already exists" } },
        { status: 409 }
      );
    }
    console.error("Create resource error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to create resource" } },
      { status: 500 }
    );
  }
}

