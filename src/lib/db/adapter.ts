import { db } from "./index";
import { users, accounts, sessions, verificationTokens } from "./schema";
import { eq, and } from "drizzle-orm";
import type { Adapter } from "next-auth/adapters";

export const DrizzleAdapter: Adapter = {
  async createUser(user) {
    const [newUser] = await db.insert(users).values({
      email: user.email!,
      name: user.name,
      image: user.image,
    }).returning();
    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      image: newUser.image,
      emailVerified: null,
    };
  },
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ? {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      emailVerified: null,
    } : null;
  },
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user ? {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      emailVerified: null,
    } : null;
  },
  async getUserByAccount({ providerAccountId, provider }) {
    const [account] = await db.select({
      user: users,
    })
      .from(accounts)
      .innerJoin(users, eq(accounts.userId, users.id))
      .where(
        and(
          eq(accounts.providerAccountId, providerAccountId),
          eq(accounts.provider, provider)
        )
      )
      .limit(1);

    return account?.user ? {
      id: account.user.id,
      email: account.user.email,
      name: account.user.name,
      image: account.user.image,
      emailVerified: null,
    } : null;
  },
  async updateUser(user) {
    const [updated] = await db.update(users)
      .set({
        name: user.name,
        image: user.image,
        email: user.email,
      })
      .where(eq(users.id, user.id))
      .returning();
    return updated ? {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      image: updated.image,
      emailVerified: null,
    } : user;
  },
  async linkAccount(account) {
    await db.insert(accounts).values({
      userId: account.userId,
      type: account.type,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      refresh_token: account.refresh_token,
      access_token: account.access_token,
      expires_at: account.expires_at,
      token_type: account.token_type,
      scope: account.scope,
      id_token: account.id_token,
      session_state: account.session_state,
    });
  },
  async createSession({ sessionToken, userId, expires }) {
    const [session] = await db.insert(sessions).values({
      sessionToken,
      userId,
      expires,
    }).returning();
    return {
      sessionToken: session.sessionToken,
      userId: session.userId,
      expires: session.expires,
    };
  },
  async getSessionAndUser(sessionToken) {
    const [result] = await db.select({
      session: sessions,
      user: users,
    })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.sessionToken, sessionToken))
      .limit(1);

    if (!result) return null;

    return {
      session: {
        sessionToken: result.session.sessionToken,
        userId: result.session.userId,
        expires: result.session.expires,
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        image: result.user.image,
        emailVerified: null,
      },
    };
  },
  async updateSession({ sessionToken, expires, userId }) {
    const [updated] = await db.update(sessions)
      .set({ expires, userId })
      .where(eq(sessions.sessionToken, sessionToken))
      .returning();
    return updated ? {
      sessionToken: updated.sessionToken,
      userId: updated.userId,
      expires: updated.expires,
    } : null;
  },
  async deleteSession(sessionToken) {
    await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
  },
  async createVerificationToken({ identifier, expires, token }) {
    const [vt] = await db.insert(verificationTokens).values({
      identifier,
      token,
      expires,
    }).returning();
    return vt;
  },
  async useVerificationToken({ identifier, token }) {
    const [vt] = await db.select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, identifier),
          eq(verificationTokens.token, token)
        )
      )
      .limit(1);

    if (!vt) return null;

    await db.delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, identifier),
          eq(verificationTokens.token, token)
        )
      );

    return vt;
  },
};

