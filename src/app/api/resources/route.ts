import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resources, roles, allocations, projects, resourceLeaves } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";
import {
  getResourceStatus,
  getWorkloadPercent,
  getCurrentProjects,
} from "@/lib/resource-utils";

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const searchParams = req.nextUrl.searchParams;
    const isActive = searchParams.get("active") !== "false";
    const roleId = searchParams.get("roleId");

    const whereConditions = [eq(resources.isActive, isActive)];
    if (roleId) {
      whereConditions.push(eq(resources.roleId, roleId));
    }

    const resourcesList = await db
      .select({
        resource: resources,
        role: roles,
      })
      .from(resources)
      .innerJoin(roles, eq(resources.roleId, roles.id))
      .where(and(...whereConditions))
      .orderBy(desc(resources.createdAt));

    // Get current month allocations
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const allAllocations = await db
      .select()
      .from(allocations)
      .where(
        and(
          eq(allocations.year, currentYear),
          eq(allocations.month, currentMonth)
        )
      );

    // Get all leaves
    const allLeaves = await db.select().from(resourceLeaves);

    // Get all projects for current projects calculation
    const allProjects = await db.select().from(projects);

    const result = resourcesList.map((r) => {
      const resource = r.resource;
      const resourceAllocations = allAllocations.filter((alloc) =>
        alloc.resourceIds.includes(resource.id)
      );
      const resourceLeavesList = allLeaves.filter(
        (leave) => leave.resourceId === resource.id
      );

      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      const currentLeave =
        resourceLeavesList.find((leave) => {
          const startDate = new Date(leave.startDate);
          const endDate = new Date(leave.endDate);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          return startDate <= todayDate && endDate >= todayDate;
        }) || null;

      const upcomingLeaves = resourceLeavesList.filter((leave) => {
        const startDate = new Date(leave.startDate);
        startDate.setHours(0, 0, 0, 0);
        return startDate > todayDate;
      });

      const status = getResourceStatus(
        resource,
        resourceAllocations,
        resourceLeavesList
      );
      const workloadPercent = getWorkloadPercent(resource, resourceAllocations);
      const currentProjectsList = getCurrentProjects(
        resource,
        resourceAllocations,
        allProjects
      );

      return {
        ...resource,
        role: r.role,
        status,
        workloadPercent,
        currentProjects: currentProjectsList,
        currentLeave,
        upcomingLeaves,
      };
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Get resources error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch resources" } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { code, name, email, roleId, specialization, availability } = body;

    if (!code || !name || !roleId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Missing required fields" } },
        { status: 400 }
      );
    }

    const [resource] = await db.insert(resources).values({
      code,
      name,
      email,
      roleId,
      specialization,
      availability: availability ?? 100,
    }).returning();

    const [role] = await db.select().from(roles).where(eq(roles.id, resource.roleId)).limit(1);

    return NextResponse.json({
      data: {
        ...resource,
        role,
      },
    });
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === "23505") {
      return NextResponse.json(
        { error: { code: "DUPLICATE", message: "Resource code already exists" } },
        { status: 409 }
      );
    }
    console.error("Create resource error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to create resource" } },
      { status: 500 }
    );
  }
}
