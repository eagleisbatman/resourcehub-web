import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import type { UserRole } from "./auth";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

export async function requireAuth(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }
  return null;
}

export async function requireRole(req: NextRequest, role: UserRole) {
  const authError = await requireAuth(req);
  if (authError) return authError;

  const user = await getCurrentUser();
  if (user?.role !== role) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
      { status: 403 }
    );
  }
  return null;
}

export async function requireSuperAdmin(req: NextRequest) {
  return requireRole(req, "SUPER_ADMIN");
}
