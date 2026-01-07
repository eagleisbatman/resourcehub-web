# Drizzle ORM Implementation

## Overview

This project uses **Drizzle ORM** with **idempotent migrations** that can be run multiple times safely without causing errors or duplicate data.

## Key Features

✅ **Idempotent Migrations**: All SQL uses `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, etc.  
✅ **Automatic Deployment**: Migrations run automatically during Vercel build  
✅ **No Duplicate Data**: Seed script uses `ON CONFLICT DO NOTHING`  
✅ **Migration Tracking**: Drizzle tracks executed migrations in `__drizzle_migrations` table

## Migration Files

- `drizzle/migrations/0000_initial.sql` - Initial schema (idempotent)
- `drizzle/migrations/meta/` - Migration metadata

## Running Migrations

### Local Development
```bash
# Run migrations
npm run db:push

# Seed initial data (idempotent)
npm run db:seed

# Generate new migration after schema changes
npm run db:generate
```

### Production Deployment

Migrations run **automatically** during Vercel build:

1. `vercel.json` includes: `"buildCommand": "npm run db:deploy && npm run build"`
2. `db:deploy` script runs migrations + seeds data
3. Both operations are idempotent - safe to run multiple times

## Migration Safety

The migration file (`0000_initial.sql`) is designed to be idempotent:

- ✅ Uses `CREATE TABLE IF NOT EXISTS` 
- ✅ Uses `CREATE INDEX IF NOT EXISTS`
- ✅ Uses `CREATE TYPE ... EXCEPTION WHEN duplicate_object`
- ✅ Uses `ON CONFLICT DO NOTHING` in seed script
- ✅ Can be run multiple times without errors

## Database Schema

Located in: `src/lib/db/schema.ts`

All tables, relations, and types are defined using Drizzle's type-safe schema.

## Converting API Routes

See `DRIZZLE_MIGRATION.md` for conversion patterns from Prisma to Drizzle.

## Troubleshooting

### Migration Already Applied
If you see "already exists" errors, that's expected - migrations are idempotent and safe to re-run.

### Connection Issues
Ensure `DATABASE_URL` is set in your environment variables.

### Seed Data Not Appearing
Run `npm run db:seed` - it uses `ON CONFLICT DO NOTHING` so won't create duplicates.

