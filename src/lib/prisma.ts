// Temporary compatibility layer - routes need to be converted to Drizzle
// This file provides Prisma-like API but throws errors to force conversion
export const prisma = new Proxy({} as any, {
  get() {
    throw new Error(
      "Prisma client no longer exists. Please convert this route to use Drizzle ORM. " +
      "See PRISMA_TO_DRIZZLE_CONVERSION.md for conversion patterns."
    );
  }
});
