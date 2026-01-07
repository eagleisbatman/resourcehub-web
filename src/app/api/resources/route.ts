import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resources, roles } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const searchParams = req.nextUrl.searchParams;
    const isActive = searchParams.get("active") !== "false";
    const roleId = searchParams.get("roleId");

    const whereConditions = [eq(resources.isActive, isActive)];
    if (roleId) {
      whereConditions.push(eq(resources.roleId, roleId));
    }

    const resourcesList = await db
      .select({
        resource: resources,
        role: roles,
      })
      .from(resources)
      .innerJoin(roles, eq(resources.roleId, roles.id))
      .where(and(...whereConditions))
      .orderBy(desc(resources.createdAt));

    const result = resourcesList.map((r) => ({
      ...r.resource,
      role: r.role,
    }));

    return NextResponse.json({ data: result });
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
    const authError = await requireAuth();
    if (authError) return authError;

    const body = await req.json();
    const { code, name, email, roleId, specialization, availability } = body;

    if (!code || !name || !roleId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Missing required fields" } },
        { status: 400 }
      );
    }

    const [resource] = await db.insert(resources).values({
      code,
      name,
      email,
      roleId,
      specialization,
      availability: availability ?? 100,
    }).returning();

    const [role] = await db.select().from(roles).where(eq(roles.id, resource.roleId)).limit(1);

    return NextResponse.json({
      data: {
        ...resource,
        role,
      },
    });
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === "23505") {
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
