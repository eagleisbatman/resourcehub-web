import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { allocations } = body;

    if (!Array.isArray(allocations)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Allocations must be an array" } },
        { status: 400 }
      );
    }

    const results = await Promise.allSettled(
      allocations.map(async (alloc: any) => {
        const { projectId, roleId, resourceIds, year, month, week, plannedHours, actualHours, notes } = alloc;

        if (!projectId || !roleId || !year || !month || !week) {
          throw new Error("Missing required fields");
        }

        return db.allocation.upsert({
          where: {
            projectId_roleId_year_month_week: {
              projectId,
              roleId,
              year,
              month,
              week,
            },
          },
          update: {
            resourceIds: resourceIds || [],
            plannedHours: plannedHours ? parseFloat(plannedHours) : 0,
            actualHours: actualHours ? parseFloat(actualHours) : 0,
            notes,
          },
          create: {
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
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").map((r: any) => r.value);
    const failed = results.filter((r) => r.status === "rejected");

    return NextResponse.json({
      data: {
        successful,
        failed: failed.length,
        total: allocations.length,
      },
    });
  } catch (error) {
    console.error("Bulk upsert allocations error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to bulk upsert allocations" } },
      { status: 500 }
    );
  }
}

