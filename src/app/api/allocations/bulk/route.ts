import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { allocations, projects, statuses, roles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { allocations: allocationsData } = body;

    if (!Array.isArray(allocationsData)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Allocations must be an array" } },
        { status: 400 }
      );
    }

    const results = await Promise.allSettled(
      allocationsData.map(async (alloc: { projectId?: string; roleId?: string; resourceIds?: string[]; year?: number; month?: number; week?: number; plannedHours?: number; actualHours?: number; notes?: string }) => {
        const { projectId, roleId, resourceIds, year, month, week, plannedHours, actualHours, notes } = alloc;

        if (!projectId || !roleId || !year || !month || !week) {
          throw new Error("Missing required fields");
        }

        const [existing] = await db
          .select()
          .from(allocations)
          .where(
            and(
              eq(allocations.projectId, projectId),
              eq(allocations.roleId, roleId),
              eq(allocations.year, year),
              eq(allocations.month, month),
              eq(allocations.week, week)
            )
          )
          .limit(1);

        if (existing) {
          const [updated] = await db
            .update(allocations)
            .set({
              resourceIds: resourceIds || [],
              plannedHours: plannedHours ? String(plannedHours) : "0",
              actualHours: actualHours ? String(actualHours) : "0",
              notes,
            })
            .where(eq(allocations.id, existing.id))
            .returning();

          const [projectResult] = await db
            .select({ project: projects, status: statuses })
            .from(projects)
            .innerJoin(statuses, eq(projects.statusId, statuses.id))
            .where(eq(projects.id, updated.projectId))
            .limit(1);

          const [role] = await db.select().from(roles).where(eq(roles.id, updated.roleId)).limit(1);

          return {
            ...updated,
            project: {
              ...projectResult?.project,
              status: projectResult?.status,
            },
            role,
          };
        } else {
          const [created] = await db.insert(allocations).values({
            projectId,
            roleId,
            resourceIds: resourceIds || [],
            year,
            month,
            week,
            plannedHours: plannedHours ? String(plannedHours) : "0",
            actualHours: actualHours ? String(actualHours) : "0",
            notes,
          }).returning();

          const [projectResult] = await db
            .select({ project: projects, status: statuses })
            .from(projects)
            .innerJoin(statuses, eq(projects.statusId, statuses.id))
            .where(eq(projects.id, created.projectId))
            .limit(1);

          const [role] = await db.select().from(roles).where(eq(roles.id, created.roleId)).limit(1);

          return {
            ...created,
            project: {
              ...projectResult?.project,
              status: projectResult?.status,
            },
            role,
          };
        }
      })
    );

    const successful = results.filter((r): r is PromiseFulfilledResult<unknown> => r.status === "fulfilled").map((r) => r.value);
    const failed = results.filter((r) => r.status === "rejected");

    return NextResponse.json({
      data: {
        successful,
        failed: failed.length,
        total: allocationsData.length,
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
