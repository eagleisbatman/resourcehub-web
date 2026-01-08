import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resourceLeaves, resources, roles } from "@/lib/db/schema";
import { eq, gte } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const leavesList = await db
      .select({
        leave: resourceLeaves,
        resource: resources,
        role: roles,
      })
      .from(resourceLeaves)
      .innerJoin(resources, eq(resourceLeaves.resourceId, resources.id))
      .innerJoin(roles, eq(resources.roleId, roles.id))
      .where(eq(resourceLeaves.resourceId, params.id))
      .orderBy(resourceLeaves.startDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = leavesList.map((item) => {
      const leave = item.leave;
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const isActive = startDate <= today && endDate >= today;
      const isUpcoming = startDate > today;

      return {
        ...leave,
        resource: {
          ...item.resource,
          role: item.role,
        },
        isActive,
        isUpcoming,
      };
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Get resource leaves error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch resource leaves" } },
      { status: 500 }
    );
  }
}
