# Prisma to Drizzle Query Conversion Guide

Many API routes still use Prisma query syntax. They need to be converted to Drizzle syntax.

## Conversion Patterns

### Find Unique
```typescript
// Prisma
const user = await prisma.user.findUnique({ where: { id } });

// Drizzle
const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
```

### Find Many
```typescript
// Prisma
const projects = await prisma.project.findMany({ where: { isArchived: false } });

// Drizzle
const projects = await db.select().from(projects).where(eq(projects.isArchived, false));
```

### Create
```typescript
// Prisma
const project = await prisma.project.create({ data: { name, code } });

// Drizzle
const [project] = await db.insert(projects).values({ name, code }).returning();
```

### Update
```typescript
// Prisma
const user = await prisma.user.update({ where: { id }, data: { name } });

// Drizzle
const [user] = await db.update(users).set({ name }).where(eq(users.id, id)).returning();
```

### Delete
```typescript
// Prisma
await prisma.user.delete({ where: { id } });

// Drizzle
await db.delete(users).where(eq(users.id, id));
```

### With Relations (Include)
```typescript
// Prisma
const project = await prisma.project.findUnique({
  where: { id },
  include: { status: true, flags: true }
});

// Drizzle
const [result] = await db
  .select({ project: projects, status: statuses })
  .from(projects)
  .innerJoin(statuses, eq(projects.statusId, statuses.id))
  .where(eq(projects.id, id))
  .limit(1);
```

## Files That Need Conversion

All files in `src/app/api/` that use `db.` with Prisma methods need conversion:
- allocations/[id]/route.ts
- allocations/bulk/route.ts
- allocations/route.ts
- config/flags/[id]/route.ts
- config/flags/route.ts
- config/roles/[id]/route.ts
- config/roles/route.ts
- dashboard/monthly/route.ts
- dashboard/project/[id]/route.ts
- dashboard/resource/[id]/route.ts
- projects/[id]/route.ts
- resources/[id]/route.ts
- resources/route.ts

## Status

- ✅ Types fixed (UserRole, Status, Flag, Role imports)
- ✅ Users API routes converted
- ✅ Projects list route converted
- ✅ Dashboard overview converted
- ✅ Status CRUD converted
- ⏳ Remaining routes need query syntax conversion

