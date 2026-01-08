import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resourceLeaves, resources, roles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const [leaveResult] = await db
      .select({
        leave: resourceLeaves,
        resource: resources,
        role: roles,
      })
      .from(resourceLeaves)
      .innerJoin(resources, eq(resourceLeaves.resourceId, resources.id))
      .innerJoin(roles, eq(resources.roleId, roles.id))
      .where(eq(resourceLeaves.id, params.id))
      .limit(1);

    if (!leaveResult) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Leave not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        ...leaveResult.leave,
        resource: {
          ...leaveResult.resource,
          role: leaveResult.role,
        },
      },
    });
  } catch (error) {
    console.error("Get leave error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch leave" } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { leaveType, startDate, endDate, notes } = body;

    const updateData: {
      leaveType?: string;
      startDate?: Date;
      endDate?: Date;
      notes?: string | null;
    } = {};
    if (leaveType !== undefined) updateData.leaveType = leaveType;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (notes !== undefined) updateData.notes = notes;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "No fields to update" } },
        { status: 400 }
      );
    }

    if (updateData.startDate && updateData.endDate) {
      if (updateData.startDate > updateData.endDate) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "Start date must be before end date" } },
          { status: 400 }
        );
      }
    }

    const [leave] = await db
      .update(resourceLeaves)
      .set(updateData)
      .where(eq(resourceLeaves.id, params.id))
      .returning();

    if (!leave) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Leave not found" } },
        { status: 404 }
      );
    }

    const [resourceResult] = await db
      .select({
        resource: resources,
        role: roles,
      })
      .from(resources)
      .innerJoin(roles, eq(resources.roleId, roles.id))
      .where(eq(resources.id, leave.resourceId))
      .limit(1);

    return NextResponse.json({
      data: {
        ...leave,
        resource: {
          ...resourceResult?.resource,
          role: resourceResult?.role,
        },
      },
    });
  } catch (error: unknown) {
    console.error("Update leave error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to update leave" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const [leave] = await db
      .delete(resourceLeaves)
      .where(eq(resourceLeaves.id, params.id))
      .returning();

    if (!leave) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Leave not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Delete leave error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to delete leave" } },
      { status: 500 }
    );
  }
}
