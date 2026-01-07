import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const resource = await prisma.resource.findUnique({
      where: { id: params.id },
      include: {
        role: true,
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Resource not found" } },
        { status: 404 }
      );
    }

    const allocations = await prisma.allocation.findMany({
      where: {
        resourceIds: {
          has: params.id,
        },
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

    const totalPlanned = allocations.reduce((sum, alloc) => sum + Number(alloc.plannedHours), 0);
    const totalActual = allocations.reduce((sum, alloc) => sum + Number(alloc.actualHours), 0);

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

    const maxHours = (resource.availability / 100) * 40 * 4;

    return NextResponse.json({
      data: {
        resource,
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

