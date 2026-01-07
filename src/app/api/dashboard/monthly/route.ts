import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { allocations, projects, statuses, roles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const searchParams = req.nextUrl.searchParams;
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

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
      .where(and(eq(allocations.year, year), eq(allocations.month, month)));

    const weeklyBreakdown: Record<number, { planned: number; actual: number }> = {};

    allocationsList.forEach((item) => {
      const week = item.allocation.week;
      if (!weeklyBreakdown[week]) {
        weeklyBreakdown[week] = { planned: 0, actual: 0 };
      }
      weeklyBreakdown[week].planned += Number(item.allocation.plannedHours);
      weeklyBreakdown[week].actual += Number(item.allocation.actualHours);
    });

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
    }, {} as Record<string, { project: { id: string; name: string; status: { id: string; name: string } }; planned: number; actual: number }>);

    const totalPlanned = allocationsList.reduce((sum, item) => sum + Number(item.allocation.plannedHours), 0);
    const totalActual = allocationsList.reduce((sum, item) => sum + Number(item.allocation.actualHours), 0);

    return NextResponse.json({
      data: {
        year,
        month,
        weeklyBreakdown: Object.entries(weeklyBreakdown).map(([week, data]) => ({
          week: parseInt(week),
          planned: Math.round(data.planned * 10) / 10,
          actual: Math.round(data.actual * 10) / 10,
        })),
        projectBreakdown: Object.values(projectBreakdown).map((item) => ({
          project: item.project,
          planned: Math.round(item.planned * 10) / 10,
          actual: Math.round(item.actual * 10) / 10,
        })),
        totalPlanned: Math.round(totalPlanned * 10) / 10,
        totalActual: Math.round(totalActual * 10) / 10,
      },
    });
  } catch (error) {
    console.error("Get monthly dashboard error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch monthly dashboard" } },
      { status: 500 }
    );
  }
}
