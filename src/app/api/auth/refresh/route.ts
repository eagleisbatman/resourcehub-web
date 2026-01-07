import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateJWT, generateRefreshToken, type UserRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: { code: "MISSING_TOKEN", message: "Refresh token is required" } },
        { status: 400 }
      );
    }

    const secret = process.env.JWT_SECRET || "";
    let decoded: { sub: string; type?: string };

    try {
      decoded = jwt.verify(refreshToken, secret) as { sub: string; type?: string };
    } catch {
      return NextResponse.json(
        { error: { code: "INVALID_TOKEN", message: "Invalid refresh token" } },
        { status: 401 }
      );
    }

    if (decoded.type !== "refresh") {
      return NextResponse.json(
        { error: { code: "INVALID_TOKEN", message: "Invalid token type" } },
        { status: 401 }
      );
    }

    const [user] = await db.select().from(users).where(eq(users.id, decoded.sub)).limit(1);

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User not found or inactive" } },
        { status: 404 }
      );
    }

    const accessToken = generateJWT(user.id, user.email, user.role as UserRole);
    const newRefreshToken = generateRefreshToken(user.id);

    return NextResponse.json({
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { error: { code: "REFRESH_ERROR", message: "Token refresh failed" } },
      { status: 500 }
    );
  }
}
