import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Missing or invalid authorization header" } },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);

    if (!decoded) {
      return NextResponse.json(
        { error: { code: "INVALID_TOKEN", message: "Invalid or expired token" } },
        { status: 401 }
      );
    }

    const [user] = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
      role: users.role,
      isActive: users.isActive,
    }).from(users).where(eq(users.id, decoded.sub)).limit(1);

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User not found or inactive" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to get user" } },
      { status: 500 }
    );
  }
}
