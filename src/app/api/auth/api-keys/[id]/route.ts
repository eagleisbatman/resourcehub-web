import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, getAuthUser } from "@/lib/api-utils";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Find the API key
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, params.id))
      .limit(1);

    if (!apiKey) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "API key not found" } },
        { status: 404 }
      );
    }

    // Users can only revoke their own keys, Super Admins can revoke any key
    if (user.role !== "SUPER_ADMIN" && apiKey.userId !== user.id) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You can only revoke your own API keys" } },
        { status: 403 }
      );
    }

    // Revoke the key (set isActive to false)
    await db
      .update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.id, params.id));

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Revoke API key error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to revoke API key" } },
      { status: 500 }
    );
  }
}
