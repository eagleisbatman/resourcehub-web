import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import type { UserRole } from "./auth";

export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user || null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }
  return null;
}

export async function requireRole(role: UserRole) {
  const authError = await requireAuth();
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

export async function requireSuperAdmin() {
  return requireRole("SUPER_ADMIN");
}
