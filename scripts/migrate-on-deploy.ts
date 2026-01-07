#!/usr/bin/env tsx
import { runMigrations } from "../src/lib/db/migrate";
import { seed } from "../src/lib/db/seed";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  
  // Skip migrations during build if DATABASE_URL is not available
  // Migrations will run at application startup instead
  if (!connectionString) {
    console.log("ℹ️  DATABASE_URL not available during build. Migrations will run at startup.");
    process.exit(0);
  }

  // Check if DATABASE_URL looks like Railway internal URL (not accessible during build)
  if (connectionString.includes("railway.internal")) {
    console.log("ℹ️  Database not accessible during build phase. Migrations will run at startup.");
    process.exit(0);
  }

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
    // If database connection fails during build, that's okay - migrations will run at startup
    if (error?.code === "ENOTFOUND" || error?.message?.includes("ENOTFOUND") || 
        error?.message?.includes("getaddrinfo")) {
      console.log("ℹ️  Database not accessible during build. Migrations will run at startup.");
      process.exit(0);
    }
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

