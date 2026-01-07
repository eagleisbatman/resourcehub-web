import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resources, roles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const [result] = await db
      .select({
        resource: resources,
        role: roles,
      })
      .from(resources)
      .innerJoin(roles, eq(resources.roleId, roles.id))
      .where(eq(resources.id, params.id))
      .limit(1);

    if (!result) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Resource not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        ...result.resource,
        role: result.role,
      },
    });
  } catch (error) {
    console.error("Get resource error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch resource" } },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const body = await req.json();
    const { code, name, email, roleId, specialization, availability, isActive } = body;

    const updateData: Record<string, unknown> = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (roleId !== undefined) updateData.roleId = roleId;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (availability !== undefined) updateData.availability = availability;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [resource] = await db.update(resources)
      .set(updateData)
      .where(eq(resources.id, params.id))
      .returning();

    if (!resource) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Resource not found" } },
        { status: 404 }
      );
    }

    const [role] = await db.select().from(roles).where(eq(roles.id, resource.roleId)).limit(1);

    return NextResponse.json({
      data: {
        ...resource,
        role,
      },
    });
  } catch (error: unknown) {
      return NextResponse.json(
        { error: { code: "DUPLICATE", message: "Resource code already exists" } },
        { status: 409 }
      );
    }
    console.error("Update resource error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to update resource" } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    await db.delete(resources).where(eq(resources.id, params.id));

    return NextResponse.json({ data: { success: true } });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to delete resource" } },
      { status: 500 }
    );
  }
}
