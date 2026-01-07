import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resources, roles, allocations, projects, statuses } from "@/lib/db/schema";
import { eq, sql, arrayContains } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const [resourceResult] = await db
      .select({
        resource: resources,
        role: roles,
      })
      .from(resources)
      .innerJoin(roles, eq(resources.roleId, roles.id))
      .where(eq(resources.id, params.id))
      .limit(1);

    if (!resourceResult) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Resource not found" } },
        { status: 404 }
      );
    }

    const allocationsList = await db
      .select({
        allocation: allocations,
        project: projects,
        status: statuses,
        role: roles,
      })
      .from(allocations)
      .innerJoin(projects, eq(allocations.projectId, projects.id))
      .innerJoin(statuses, eq(projects.statusId, statuses.id))
      .innerJoin(roles, eq(allocations.roleId, roles.id))
      .where(sql`${allocations.resourceIds}::jsonb @> ${JSON.stringify([params.id])}::jsonb`);

    const totalPlanned = allocationsList.reduce((sum, item) => sum + Number(item.allocation.plannedHours), 0);
    const totalActual = allocationsList.reduce((sum, item) => sum + Number(item.allocation.actualHours), 0);

    const projectBreakdown = allocationsList.reduce((acc, item) => {
      const projectId = item.allocation.projectId;
      if (!acc[projectId]) {
        acc[projectId] = {
          project: {
            ...item.project,
            status: item.status,
          },
          planned: 0,
          actual: 0,
        };
      }
      acc[projectId].planned += Number(item.allocation.plannedHours);
      acc[projectId].actual += Number(item.allocation.actualHours);
      return acc;
    }, {} as Record<string, any>);

    const maxHours = (resourceResult.resource.availability / 100) * 40 * 4;

    return NextResponse.json({
      data: {
        resource: {
          ...resourceResult.resource,
          role: resourceResult.role,
        },
        totalPlanned: Math.round(totalPlanned * 10) / 10,
        totalActual: Math.round(totalActual * 10) / 10,
        utilization: maxHours > 0 ? Math.round((totalActual / maxHours) * 10000) / 100 : 0,
        projectBreakdown: Object.values(projectBreakdown).map((item: any) => ({
          project: item.project,
          planned: Math.round(item.planned * 10) / 10,
          actual: Math.round(item.actual * 10) / 10,
        })),
      },
    });
  } catch (error) {
    console.error("Get resource dashboard error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch resource dashboard" } },
      { status: 500 }
    );
  }
}
