# Drizzle Migration Guide

## Overview

The project has been migrated from Prisma to Drizzle ORM with idempotent migrations that can be run multiple times safely.

## Key Features

1. **Idempotent Migrations**: All migrations use `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, etc.
2. **Automatic Migration on Deploy**: Migrations run automatically during Vercel build
3. **No Duplicate Data**: Seed script uses `onConflictDoNothing()` to prevent duplicates
4. **Migration Tracking**: Drizzle tracks which migrations have been run

## Migration Files

- `drizzle/migrations/0000_initial.sql` - Initial schema with idempotent SQL
- All migrations are stored in `drizzle/migrations/` directory

## Running Migrations

### Development
```bash
npm run db:push  # Run migrations
npm run db:seed  # Seed initial data
```

### Production (Automatic)
Migrations run automatically during Vercel build via `vercel.json`:
```json
{
  "buildCommand": "npm run db:deploy && npm run build"
}
```

The `db:deploy` script runs migrations and seeds data idempotently.

## API Route Conversion Pattern

### Before (Prisma)
```typescript
import { prisma } from "@/lib/prisma";

const projects = await prisma.project.findMany({
  where: { isArchived: false },
  include: { status: true }
});
```

### After (Drizzle)
```typescript
import { db } from "@/lib/db";
import { projects, statuses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const projectsList = await db
  .select({
    project: projects,
    status: statuses,
  })
  .from(projects)
  .innerJoin(statuses, eq(projects.statusId, statuses.id))
  .where(eq(projects.isArchived, false));
```

## Remaining API Routes to Convert

The following routes still need conversion from Prisma to Drizzle:
- `/api/projects/[id]/route.ts`
- `/api/resources/route.ts`
- `/api/resources/[id]/route.ts`
- `/api/allocations/route.ts`
- `/api/allocations/[id]/route.ts`
- `/api/allocations/bulk/route.ts`
- `/api/config/statuses/route.ts`
- `/api/config/statuses/[id]/route.ts`
- `/api/config/flags/route.ts`
- `/api/config/flags/[id]/route.ts`
- `/api/config/roles/route.ts`
- `/api/config/roles/[id]/route.ts`
- `/api/users/route.ts`
- `/api/users/[id]/route.ts`
- `/api/dashboard/overview/route.ts`
- `/api/dashboard/monthly/route.ts`
- `/api/dashboard/project/[id]/route.ts`
- `/api/dashboard/resource/[id]/route.ts`

## Common Drizzle Patterns

### Select with joins
```typescript
const result = await db
  .select({
    project: projects,
    status: statuses,
  })
  .from(projects)
  .innerJoin(statuses, eq(projects.statusId, statuses.id))
  .where(eq(projects.id, projectId))
  .limit(1);
```

### Insert with conflict handling
```typescript
await db.insert(statuses)
  .values({ name: "Active", color: "#10B981" })
  .onConflictDoNothing();
```

### Update
```typescript
await db.update(projects)
  .set({ name: "New Name" })
  .where(eq(projects.id, projectId));
```

### Delete
```typescript
await db.delete(projects)
  .where(eq(projects.id, projectId));
```

### Count
```typescript
const count = await db
  .select({ count: sql<number>`count(*)` })
  .from(projects)
  .where(eq(projects.isArchived, false));
```

## Next Steps

1. Convert remaining API routes using the patterns above
2. Test migrations locally: `npm run db:push`
3. Verify idempotency by running migrations multiple times
4. Deploy to Vercel - migrations will run automatically

