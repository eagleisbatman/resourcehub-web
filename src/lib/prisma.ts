// Temporary compatibility layer - routes need to be converted to Drizzle
// This file provides Prisma-like API but throws errors to force conversion
export const prisma = new Proxy({} as Record<string, never>, {
  get() {
    throw new Error(
      "Prisma client no longer exists. Please convert this route to use Drizzle ORM."
    );
  }
});
