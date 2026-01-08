import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resourceLeaves, resources, roles } from "@/lib/db/schema";
import { eq, and, gte, lte, or, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const searchParams = req.nextUrl.searchParams;
    const resourceId = searchParams.get("resourceId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const leaveType = searchParams.get("leaveType");

    const whereConditions = [];

    if (resourceId) {
      whereConditions.push(eq(resourceLeaves.resourceId, resourceId));
    }

    if (startDate && endDate) {
      // Find leaves that overlap with the date range
      whereConditions.push(
        or(
          and(
            lte(resourceLeaves.startDate, new Date(endDate)),
            gte(resourceLeaves.endDate, new Date(startDate))
          )
        )
      );
    } else if (startDate) {
      whereConditions.push(gte(resourceLeaves.endDate, new Date(startDate)));
    } else if (endDate) {
      whereConditions.push(lte(resourceLeaves.startDate, new Date(endDate)));
    }

    if (leaveType) {
      whereConditions.push(eq(resourceLeaves.leaveType, leaveType as any));
    }

    const leavesList = await db
      .select({
        leave: resourceLeaves,
        resource: resources,
        role: roles,
      })
      .from(resourceLeaves)
      .innerJoin(resources, eq(resourceLeaves.resourceId, resources.id))
      .innerJoin(roles, eq(resources.roleId, roles.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(resourceLeaves.startDate);

    const result = leavesList.map((item) => ({
      ...item.leave,
      resource: {
        ...item.resource,
        role: item.role,
      },
    }));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Get leaves error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch leaves" } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { resourceId, leaveType, startDate, endDate, notes } = body;

    if (!resourceId || !startDate || !endDate) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Missing required fields" } },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Start date must be before end date" } },
        { status: 400 }
      );
    }

    const [leave] = await db
      .insert(resourceLeaves)
      .values({
        resourceId,
        leaveType: leaveType || "leave",
        startDate: start,
        endDate: end,
        notes: notes || null,
      })
      .returning();

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
    console.error("Create leave error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to create leave" } },
      { status: 500 }
    );
  }
}
