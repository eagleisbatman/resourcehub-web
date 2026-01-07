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
    const projectId = searchParams.get("projectId");
    const roleId = searchParams.get("roleId");

    const allocations = await prisma.allocation.findMany({
      where: {
        year,
        month,
        ...(projectId && { projectId }),
        ...(roleId && { roleId }),
      },
      include: {
        project: {
          include: {
            status: true,
          },
        },
        role: true,
      },
      orderBy: [
        { project: { name: "asc" } },
        { role: { order: "asc" } },
        { week: "asc" },
      ],
    });

    return NextResponse.json({ data: allocations });
  } catch (error) {
    console.error("Get allocations error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch allocations" } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { projectId, roleId, resourceIds, year, month, week, plannedHours, actualHours, notes } = body;

    if (!projectId || !roleId || !year || !month || !week) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Missing required fields" } },
        { status: 400 }
      );
    }

    const allocation = await prisma.allocation.create({
      data: {
        projectId,
        roleId,
        resourceIds: resourceIds || [],
        year,
        month,
        week,
        plannedHours: plannedHours ? parseFloat(plannedHours) : 0,
        actualHours: actualHours ? parseFloat(actualHours) : 0,
        notes,
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

    return NextResponse.json({ data: allocation });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: { code: "DUPLICATE", message: "Allocation already exists for this project/role/week" } },
        { status: 409 }
      );
    }
    console.error("Create allocation error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to create allocation" } },
      { status: 500 }
    );
  }
}

