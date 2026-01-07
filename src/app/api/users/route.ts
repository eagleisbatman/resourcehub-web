import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireSuperAdmin } from "@/lib/api-utils";

export async function GET() {
  try {
    const authError = await requireSuperAdmin();
    if (authError) return authError;

    const usersList = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).orderBy(users.createdAt);

    return NextResponse.json({ data: usersList });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch users" } },
      { status: 500 }
    );
  }
}
