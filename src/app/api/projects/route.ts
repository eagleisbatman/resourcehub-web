import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, statuses, projectFlags, flags } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const searchParams = req.nextUrl.searchParams;
    const isArchived = searchParams.get("archived") === "true";
    const statusId = searchParams.get("statusId");

    const whereConditions = [eq(projects.isArchived, isArchived)];
    if (statusId) {
      whereConditions.push(eq(projects.statusId, statusId));
    }

    const projectsList = await db
      .select({
        project: projects,
        status: statuses,
      })
      .from(projects)
      .innerJoin(statuses, eq(projects.statusId, statuses.id))
      .where(and(...whereConditions))
      .orderBy(desc(projects.createdAt));

    const projectFlagsList = await db
      .select()
      .from(projectFlags)
      .innerJoin(flags, eq(projectFlags.flagId, flags.id));

    const flagsMap = new Map<string, typeof flags.$inferSelect[]>();
    projectFlagsList.forEach((pf) => {
      if (!flagsMap.has(pf.project_flags.projectId)) {
        flagsMap.set(pf.project_flags.projectId, []);
      }
      flagsMap.get(pf.project_flags.projectId)!.push(pf.flags);
    });

    const result = projectsList.map((p) => ({
      ...p.project,
      status: p.status,
      flags: flagsMap.get(p.project.id) || [],
    }));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch projects" } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const body = await req.json();
    const { code, name, description, startDate, endDate, isOngoing, statusId, flagIds } = body;

    if (!code || !name || !statusId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Missing required fields" } },
        { status: 400 }
      );
    }

    const [project] = await db.insert(projects).values({
      code,
      name,
      description,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      isOngoing: isOngoing || false,
      statusId,
    }).returning();

    if (flagIds && flagIds.length > 0) {
      await db.insert(projectFlags).values(
        flagIds.map((flagId: string) => ({
          projectId: project.id,
          flagId,
        }))
      );
    }

    const [status] = await db.select().from(statuses).where(eq(statuses.id, project.statusId)).limit(1);
    const projectFlagsList = await db
      .select({ flag: flags })
      .from(projectFlags)
      .innerJoin(flags, eq(projectFlags.flagId, flags.id))
      .where(eq(projectFlags.projectId, project.id));

    return NextResponse.json({
      data: {
        ...project,
        status,
        flags: projectFlagsList.map((pf) => pf.flag),
      },
    });
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === "23505") {
      return NextResponse.json(
        { error: { code: "DUPLICATE", message: "Project code already exists" } },
        { status: 409 }
      );
    }
    console.error("Create project error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to create project" } },
      { status: 500 }
    );
  }
}
