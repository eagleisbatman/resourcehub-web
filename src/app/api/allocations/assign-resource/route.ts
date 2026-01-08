import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { allocations, projects, resources, roles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";
import { createId } from "@paralleldrive/cuid2";

export async function POST(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { projectId, resourceId, year, month, roleId } = body;

    if (!projectId || !resourceId || !year || !month) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Missing required fields" } },
        { status: 400 }
      );
    }

    // Get resource's role if not provided
    let finalRoleId = roleId;
    if (!finalRoleId) {
      const [resource] = await db
        .select()
        .from(resources)
        .where(eq(resources.id, resourceId))
        .limit(1);
      
      if (!resource) {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Resource not found" } },
          { status: 404 }
        );
      }
      finalRoleId = resource.roleId;
    }

    // Create allocations for all 5 weeks
    const weeks = [1, 2, 3, 4, 5];
    const createdAllocations = [];

    for (const week of weeks) {
      // Check if allocation already exists
      const [existing] = await db
        .select()
        .from(allocations)
        .where(
          and(
            eq(allocations.projectId, projectId),
            eq(allocations.roleId, finalRoleId),
            eq(allocations.year, year),
            eq(allocations.month, month),
            eq(allocations.week, week)
          )
        )
        .limit(1);

      if (existing) {
        // Add resource to existing allocation if not already present
        if (!existing.resourceIds.includes(resourceId)) {
          const updatedResourceIds = [...existing.resourceIds, resourceId];
          await db
            .update(allocations)
            .set({ resourceIds: updatedResourceIds })
            .where(eq(allocations.id, existing.id));
          createdAllocations.push({ ...existing, resourceIds: updatedResourceIds });
        } else {
          createdAllocations.push(existing);
        }
      } else {
        // Create new allocation
        const [created] = await db
          .insert(allocations)
          .values({
            id: createId(),
            projectId,
            roleId: finalRoleId,
            resourceIds: [resourceId],
            year,
            month,
            week,
            plannedHours: "0",
            actualHours: "0",
          })
          .returning();
        createdAllocations.push(created);
      }
    }

    return NextResponse.json({
      data: {
        success: true,
        allocationsCreated: createdAllocations.length,
      },
    });
  } catch (error) {
    console.error("Assign resource error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to assign resource" } },
      { status: 500 }
    );
  }
}
