import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "./db/adapter";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

export type UserRole = "SUPER_ADMIN" | "ADMIN";

const allowedDomains = process.env.ALLOWED_DOMAINS?.split(",") || [];
const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "";

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      const emailDomain = user.email.split("@")[1];
      if (!allowedDomains.includes(emailDomain)) {
        return false;
      }

      if (account && account.provider === "google") {
        const [existingUser] = await db.select().from(users).where(eq(users.email, user.email)).limit(1);

        if (!existingUser) {
          await db.insert(users).values({
            email: user.email,
            name: user.name || null,
            image: user.image || null,
            role: user.email === superAdminEmail ? "SUPER_ADMIN" : "ADMIN",
          });
        } else if (!existingUser.isActive) {
          return false;
        }
      }

      return true;
    },
    async session({ session, user }) {
      if (session.user?.email) {
        const [dbUser] = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);

        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.role = dbUser.role as UserRole;
          session.user.isActive = dbUser.isActive;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
  },
};

export function generateJWT(userId: string, email: string, role: UserRole): string {
  const secret = process.env.JWT_SECRET || "";
  return jwt.sign(
    {
      sub: userId,
      email,
      role,
      iat: Math.floor(Date.now() / 1000),
    },
    secret,
    {
      expiresIn: "7d",
    }
  );
}

export function verifyJWT(token: string): { sub: string; email: string; role: UserRole } | null {
  try {
    const secret = process.env.JWT_SECRET || "";
    const decoded = jwt.verify(token, secret) as { sub: string; email: string; role: UserRole };
    return decoded;
  } catch {
    return null;
  }
}

export function generateRefreshToken(userId: string): string {
  const secret = process.env.JWT_SECRET || "";
  return jwt.sign({ sub: userId, type: "refresh" }, secret, {
    expiresIn: "30d",
  });
}

