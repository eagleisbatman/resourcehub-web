import type { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "./db/adapter";
import { db } from "./db";
import { users, accounts } from "./db/schema";
import { eq, and } from "drizzle-orm";
import jwt from "jsonwebtoken";

export type UserRole = "SUPER_ADMIN" | "ADMIN";

const allowedDomains = process.env.ALLOWED_DOMAINS?.split(",") || [];

export const authOptions: NextAuthConfig = {
  adapter: DrizzleAdapter,
  trustHost: true, // Required for Railway/proxy deployments
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Check domain restriction
      const emailDomain = user.email.split("@")[1];
      if (!allowedDomains.includes(emailDomain)) {
        return false;
      }

      // Check if user exists and is active, and proactively link account if needed
      if (account && account.provider === "google" && account.providerAccountId) {
        const [existingUser] = await db.select().from(users).where(eq(users.email, user.email)).limit(1);

        if (existingUser) {
          // User exists - check if active
          if (!existingUser.isActive) {
            return false;
          }
          // Update user info if needed (name, image might have changed)
          await db.update(users)
            .set({
              name: user.name || existingUser.name,
              image: user.image || existingUser.image,
            })
            .where(eq(users.email, user.email));

          // Proactively check and link account to prevent OAuthAccountNotLinked error
          const [existingAccount] = await db.select()
            .from(accounts)
            .where(
              and(
                eq(accounts.provider, account.provider),
                eq(accounts.providerAccountId, account.providerAccountId)
              )
            )
            .limit(1);

          if (existingAccount) {
            // Account exists - ensure it's linked to the correct user
            if (existingAccount.userId !== existingUser.id) {
              // Account is linked to different user - update it to link to current user
              await db.update(accounts)
                .set({
                  userId: existingUser.id,
                  type: account.type,
                  refresh_token: account.refresh_token || existingAccount.refresh_token,
                  access_token: account.access_token || existingAccount.access_token,
                  expires_at: account.expires_at ? Number(account.expires_at) : existingAccount.expires_at,
                  token_type: account.token_type || existingAccount.token_type,
                  scope: account.scope || existingAccount.scope,
                  id_token: account.id_token || existingAccount.id_token,
                  session_state: account.session_state || existingAccount.session_state,
                })
                .where(eq(accounts.id, existingAccount.id));
            }
          } else {
            // Account doesn't exist - create it proactively to prevent NextAuth error
            await db.insert(accounts).values({
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token || null,
              access_token: account.access_token || null,
              expires_at: account.expires_at ? Number(account.expires_at) : null,
              token_type: account.token_type || null,
              scope: account.scope || null,
              id_token: account.id_token || null,
              session_state: account.session_state || null,
            });
          }
        }
        // If user doesn't exist, let adapter create it (adapter will set role automatically)
      }

      return true;
    },
    async session({ session }) {
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

// NextAuth v5 beta - session helper
// Note: NextAuth v5 beta uses different API
// We'll use the route handler approach for now
export async function getServerSession() {
  try {
    // For NextAuth v5 beta, we need to use cookies directly
    // This is a workaround until v5 is stable
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("next-auth.session-token") || cookieStore.get("__Secure-next-auth.session-token");
    
    if (!sessionToken) {
      return null;
    }

    // Get session from database using the token
    const { db } = await import("./db");
    const { sessions } = await import("./db/schema");
    const { eq } = await import("drizzle-orm");
    
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionToken, sessionToken.value)).limit(1);
    
    if (!session || session.expires < new Date()) {
      return null;
    }

    // Get user from session
    const { users } = await import("./db/schema");
    const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    
    if (!user || !user.isActive) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role as UserRole,
        isActive: user.isActive,
      },
      expires: session.expires.toISOString(),
    };
  } catch {
    return null;
  }
}


