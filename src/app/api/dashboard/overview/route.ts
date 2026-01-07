import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, resources, allocations } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";

export async function GET(_req: NextRequest) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const [totalProjectsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.isArchived, false));

    const [activeProjectsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(and(eq(projects.isArchived, false), eq(projects.isOngoing, true)));

    const [totalResourcesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(resources)
      .where(eq(resources.isActive, true));

    const [totalAllocationsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(allocations);

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const monthlyAllocations = await db
      .select()
      .from(allocations)
      .where(and(eq(allocations.year, currentYear), eq(allocations.month, currentMonth)));

    const totalPlannedHours = monthlyAllocations.reduce(
      (sum, alloc) => sum + Number(alloc.plannedHours),
      0
    );
    const totalActualHours = monthlyAllocations.reduce(
      (sum, alloc) => sum + Number(alloc.actualHours),
      0
    );

    const utilization = totalPlannedHours > 0 ? (totalActualHours / totalPlannedHours) * 100 : 0;

    return NextResponse.json({
      data: {
        totalProjects: Number(totalProjectsResult?.count || 0),
        activeProjects: Number(activeProjectsResult?.count || 0),
        totalResources: Number(totalResourcesResult?.count || 0),
        activeResources: Number(totalResourcesResult?.count || 0),
        totalAllocations: Number(totalAllocationsResult?.count || 0),
        monthlyUtilization: Math.round(utilization * 100) / 100,
        totalPlannedHours: Math.round(totalPlannedHours * 10) / 10,
        totalActualHours: Math.round(totalActualHours * 10) / 10,
      },
    });
  } catch (error) {
    console.error("Get dashboard overview error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch dashboard overview" } },
      { status: 500 }
    );
  }
}
