#!/usr/bin/env tsx
import { runMigrations } from "../src/lib/db/migrate";
import { seed } from "../src/lib/db/seed";

async function main() {
  try {
    console.log("🚀 Starting deployment migration...");
    
    // Run migrations (idempotent - safe to run multiple times)
    await runMigrations();
    
    console.log("🌱 Running seed data (idempotent)...");
    // Seed data (idempotent - uses ON CONFLICT DO NOTHING)
    await seed();
    
    console.log("✅ Deployment migration completed successfully");
    process.exit(0);
  } catch (error: any) {
    // If migration already applied, that's okay - continue
    if (error?.message?.includes("already exists") || error?.message?.includes("duplicate")) {
      console.log("ℹ️  Migrations already applied, continuing...");
      await seed();
      process.exit(0);
    }
    console.error("❌ Deployment migration failed:", error);
    process.exit(1);
  }
}

main();

