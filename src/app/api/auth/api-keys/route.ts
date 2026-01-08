import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiKeys, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, getAuthUser, requireSuperAdmin } from "@/lib/api-utils";
import { generateApiKey, hashApiKey, extractKeyPrefix } from "@/lib/api-key-utils";

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Super Admins can see all keys, regular users see only their own
    const whereConditions = user.role === "SUPER_ADMIN" 
      ? [] 
      : [eq(apiKeys.userId, user.id)];

    const keysQuery = db
      .select({
        apiKey: apiKeys,
        user: {
          id: users.id,
          email: users.email,
        },
      })
      .from(apiKeys)
      .innerJoin(users, eq(apiKeys.userId, users.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(apiKeys.createdAt));

    const keysWithUsers = await keysQuery;

    // Mask keys for security (only show prefix)
    const maskedKeys = keysWithUsers.map(({ apiKey, user: keyUser }) => ({
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      role: apiKey.role,
      isActive: apiKey.isActive,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
      userId: apiKey.userId,
      userEmail: user.role === "SUPER_ADMIN" ? keyUser.email : undefined,
    }));

    return NextResponse.json({ data: maskedKeys });
  } catch (error) {
    console.error("Get API keys error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to fetch API keys" } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, expiresAt } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Name is required" } },
        { status: 400 }
      );
    }

    // Generate API key
    const plainKey = generateApiKey();
    const hashedKey = await hashApiKey(plainKey);
    const keyPrefix = extractKeyPrefix(plainKey);

    // Role automatically matches user's role (no escalation)
    const [apiKey] = await db
      .insert(apiKeys)
      .values({
        name: name.trim(),
        key: hashedKey,
        keyPrefix,
        userId: user.id,
        role: user.role, // Match user's role
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      .returning();

    // Return full key only once (for user to copy)
    return NextResponse.json({
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key: plainKey, // Full key shown only once
        keyPrefix: apiKey.keyPrefix,
        role: apiKey.role,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (error) {
    console.error("Create API key error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to create API key" } },
      { status: 500 }
    );
  }
}
