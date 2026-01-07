import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { allocations, projects, statuses, roles } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
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

    const whereConditions = [
      eq(allocations.year, year),
      eq(allocations.month, month),
    ];
    if (projectId) {
      whereConditions.push(eq(allocations.projectId, projectId));
    }
    if (roleId) {
      whereConditions.push(eq(allocations.roleId, roleId));
    }

    const allocationsList = await db
      .select({
        allocation: allocations,
        project: projects,
        status: statuses,
        role: roles,
      })
      .from(allocations)
      .innerJoin(projects, eq(allocations.projectId, projects.id))
      .innerJoin(statuses, eq(projects.statusId, statuses.id))
      .innerJoin(roles, eq(allocations.roleId, roles.id))
      .where(and(...whereConditions))
      .orderBy(asc(projects.name), asc(roles.order), asc(allocations.week));

    const result = allocationsList.map((a) => ({
      ...a.allocation,
      project: {
        ...a.project,
        status: a.status,
      },
      role: a.role,
    }));

    return NextResponse.json({ data: result });
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

    const [allocation] = await db.insert(allocations).values({
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
      .where(eq(projects.id, allocation.projectId))
      .limit(1);

    const [role] = await db.select().from(roles).where(eq(roles.id, allocation.roleId)).limit(1);

    return NextResponse.json({
      data: {
        ...allocation,
        project: {
          ...projectResult?.project,
          status: projectResult?.status,
        },
        role,
      },
    });
  } catch (error: unknown) {
        if (err.code === "23505") {
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
