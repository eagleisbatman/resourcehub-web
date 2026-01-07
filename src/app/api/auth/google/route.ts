import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateJWT, generateRefreshToken } from "@/lib/auth";
import type { UserRole } from "@/lib/auth";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const allowedDomains = process.env.ALLOWED_DOMAINS?.split(",") || [];
const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: { code: "MISSING_TOKEN", message: "ID token is required" } }, { status: 400 });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json({ error: { code: "INVALID_TOKEN", message: "Invalid ID token" } }, { status: 401 });
    }

    const emailDomain = payload.email.split("@")[1];
    if (!allowedDomains.includes(emailDomain)) {
      return NextResponse.json(
        { error: { code: "DOMAIN_NOT_ALLOWED", message: "Domain not allowed" } },
        { status: 403 }
      );
    }

    const [existingUser] = await db.select().from(users).where(eq(users.email, payload.email)).limit(1);

    let user;
    if (!existingUser) {
      const [newUser] = await db.insert(users).values({
        email: payload.email,
        name: payload.name || null,
        image: payload.picture || null,
        role: payload.email === superAdminEmail ? "SUPER_ADMIN" : "ADMIN",
      }).returning();
      user = newUser;
    } else {
      user = existingUser;
    }

    if (!user.isActive) {
      return NextResponse.json({ error: { code: "USER_INACTIVE", message: "User is inactive" } }, { status: 403 });
    }

    const accessToken = generateJWT(user.id, user.email, user.role as UserRole);
    const refreshToken = generateRefreshToken(user.id);

    return NextResponse.json({
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: { code: "AUTH_ERROR", message: "Authentication failed" } },
      { status: 500 }
    );
  }
}
