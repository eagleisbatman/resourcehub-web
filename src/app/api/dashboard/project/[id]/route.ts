import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, statuses, projectFlags, flags, allocations, roles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const [projectResult] = await db
      .select({
        project: projects,
        status: statuses,
      })
      .from(projects)
      .innerJoin(statuses, eq(projects.statusId, statuses.id))
      .where(eq(projects.id, params.id))
      .limit(1);

    if (!projectResult) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Project not found" } },
        { status: 404 }
      );
    }

    const projectFlagsList = await db
      .select({ flag: flags })
      .from(projectFlags)
      .innerJoin(flags, eq(projectFlags.flagId, flags.id))
      .where(eq(projectFlags.projectId, params.id));

    const allocationsList = await db
      .select({
        allocation: allocations,
        role: roles,
      })
      .from(allocations)
      .innerJoin(roles, eq(allocations.roleId, roles.id))
      .where(eq(allocations.projectId, params.id));

    const totalPlanned = allocationsList.reduce((sum, item) => sum + Number(item.allocation.plannedHours), 0);
    const totalActual = allocationsList.reduce((sum, item) => sum + Number(item.allocation.actualHours), 0);

    const roleBreakdown = allocationsList.reduce((acc, item) => {
      const roleId = item.allocation.roleId;
      if (!acc[roleId]) {
        acc[roleId] = {
          role: item.role,
          planned: 0,
          actual: 0,
        };
      }
      acc[roleId].planned += Number(item.allocation.plannedHours);
      acc[roleId].actual += Number(item.allocation.actualHours);
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      data: {
        project: {
          ...projectResult.project,
          status: projectResult.status,
          flags: projectFlagsList.map((pf) => pf.flag),
        },
        totalPlanned: Math.round(totalPlanned * 10) / 10,
        totalActual: Math.round(totalActual * 10) / 10,
        roleBreakdown: Object.values(roleBreakdown).map((item: any) => ({
          role: item.role,
          planned: Math.round(item.planned * 10) / 10,
          actual: Math.round(item.actual * 10) / 10,
        })),
      },
    });
  } catch (error) {
    console.error("Get project dashboard error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch project dashboard" } },
      { status: 500 }
    );
  }
}
