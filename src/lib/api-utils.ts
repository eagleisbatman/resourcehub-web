import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import type { UserRole } from "./auth";
import { db } from "./db";
import { apiKeys, users } from "./db/schema";
import { eq, and } from "drizzle-orm";
import { validateApiKey, extractKeyPrefix } from "./api-key-utils";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string | null;
  isActive: boolean;
}

/**
 * Get current user from session (web admin)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getServerSession();
  if (!session?.user) return null;
  
  return {
    id: session.user.id,
    email: session.user.email || "",
    role: session.user.role,
    name: session.user.name,
    isActive: session.user.isActive ?? true,
  };
}

/**
 * Get user from API key (MCP server)
 */
export async function getApiKeyUser(req: NextRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const apiKey = authHeader.substring(7);
  
  // Extract prefix for lookup (consistent with extractKeyPrefix utility)
  const prefix = extractKeyPrefix(apiKey);
  
  // Find API keys with matching prefix
  const apiKeyRecords = await db
    .select({
      apiKey: apiKeys,
      user: users,
    })
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(
      and(
        eq(apiKeys.keyPrefix, prefix),
        eq(apiKeys.isActive, true)
      )
    );

  if (apiKeyRecords.length === 0) {
    return null;
  }

  // Validate against each key (bcrypt compare)
  for (const record of apiKeyRecords) {
    const { apiKey: keyRecord, user } = record;

    // Check if key is expired
    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      continue;
    }

    // Check if user is active
    if (!user.isActive) {
      continue;
    }

    // Validate the API key hash
    const isValid = await validateApiKey(apiKey, keyRecord.key);
    if (isValid) {
      // Update last used timestamp
      await db
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, keyRecord.id));

      return {
        id: user.id,
        email: user.email,
        role: keyRecord.role, // Use role from API key, not user
        name: user.name,
        isActive: user.isActive,
      };
    }
  }

  return null;
}

/**
 * Get current user from either session or API key
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<AuthUser | null> {
  // Try session first (web admin)
  const sessionUser = await getCurrentUser();
  if (sessionUser) {
    return sessionUser;
  }

  // Try API key (MCP server)
  const apiKeyUser = await getApiKeyUser(req);
  if (apiKeyUser) {
    return apiKeyUser;
  }

  return null;
}

/**
 * Require authentication (session or API key)
 */
export async function requireAuth(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }
  return null;
}

/**
 * Require specific role
 */
export async function requireRole(req: NextRequest, role: UserRole) {
  const authError = await requireAuth(req);
  if (authError) return authError;

  const user = await getAuthenticatedUser(req);
  if (user?.role !== role) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Require Super Admin role
 */
export async function requireSuperAdmin(req: NextRequest) {
  return requireRole(req, "SUPER_ADMIN");
}

/**
 * Get authenticated user (for use in route handlers)
 * Returns user or null, doesn't return error response
 */
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  return getAuthenticatedUser(req);
}
