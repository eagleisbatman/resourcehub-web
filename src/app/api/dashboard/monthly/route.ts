import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const searchParams = req.nextUrl.searchParams;
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

    const allocations = await prisma.allocation.findMany({
      where: {
        year,
        month,
      },
      include: {
        project: {
          include: {
            status: true,
          },
        },
        role: true,
      },
    });

    const weeklyBreakdown: Record<number, { planned: number; actual: number }> = {};

    allocations.forEach((alloc) => {
      if (!weeklyBreakdown[alloc.week]) {
        weeklyBreakdown[alloc.week] = { planned: 0, actual: 0 };
      }
      weeklyBreakdown[alloc.week].planned += Number(alloc.plannedHours);
      weeklyBreakdown[alloc.week].actual += Number(alloc.actualHours);
    });

    const projectBreakdown = allocations.reduce((acc, alloc) => {
      const projectId = alloc.projectId;
      if (!acc[projectId]) {
        acc[projectId] = {
          project: alloc.project,
          planned: 0,
          actual: 0,
        };
      }
      acc[projectId].planned += Number(alloc.plannedHours);
      acc[projectId].actual += Number(alloc.actualHours);
      return acc;
    }, {} as Record<string, any>);

    const totalPlanned = allocations.reduce((sum, alloc) => sum + Number(alloc.plannedHours), 0);
    const totalActual = allocations.reduce((sum, alloc) => sum + Number(alloc.actualHours), 0);

    return NextResponse.json({
      data: {
        year,
        month,
        weeklyBreakdown: Object.entries(weeklyBreakdown).map(([week, data]) => ({
          week: parseInt(week),
          planned: Math.round(data.planned * 10) / 10,
          actual: Math.round(data.actual * 10) / 10,
        })),
        projectBreakdown: Object.values(projectBreakdown).map((item: any) => ({
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

