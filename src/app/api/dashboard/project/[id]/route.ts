import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        status: true,
        flags: {
          include: {
            flag: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Project not found" } },
        { status: 404 }
      );
    }

    const allocations = await prisma.allocation.findMany({
      where: {
        projectId: params.id,
      },
      include: {
        role: true,
      },
    });

    const totalPlanned = allocations.reduce((sum, alloc) => sum + Number(alloc.plannedHours), 0);
    const totalActual = allocations.reduce((sum, alloc) => sum + Number(alloc.actualHours), 0);

    const roleBreakdown = allocations.reduce((acc, alloc) => {
      const roleId = alloc.roleId;
      if (!acc[roleId]) {
        acc[roleId] = {
          role: alloc.role,
          planned: 0,
          actual: 0,
        };
      }
      acc[roleId].planned += Number(alloc.plannedHours);
      acc[roleId].actual += Number(alloc.actualHours);
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      data: {
        project: {
          ...project,
          flags: project.flags.map((pf) => pf.flag),
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

