#!/usr/bin/env tsx
import { runMigrations } from "../src/lib/db/migrate";
import { seed } from "../src/lib/db/seed";
import { spawn } from "child_process";

async function runMigrationsAndStart() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error("❌ DATABASE_URL not set. Cannot run migrations.");
    process.exit(1);
  }

  try {
    console.log("🔄 Running database migrations...");
    await runMigrations();
    console.log("✅ Migrations completed");
    
    console.log("🌱 Seeding initial data...");
    await seed();
    console.log("✅ Seed data completed");
    
    console.log("🚀 Starting Next.js server...");
    // Start Next.js
    const nextProcess = spawn("npm", ["start"], {
      stdio: "inherit",
      shell: true,
    });
    
    nextProcess.on("exit", (code: number) => {
      process.exit(code || 0);
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Migration error:", errorMessage);
    
    // If migrations already applied, continue anyway
    if (errorMessage.includes("already exists") || errorMessage.includes("duplicate")) {
      console.log("ℹ️  Migrations already applied, continuing...");
      try {
        await seed();
      } catch (seedError) {
        console.error("⚠️  Seed error (continuing anyway):", seedError);
      }
      
      // Start Next.js even if migrations had issues
      console.log("🚀 Starting Next.js server...");
      const nextProcess = spawn("npm", ["start"], {
        stdio: "inherit",
        shell: true,
      });
      
      nextProcess.on("exit", (code: number) => {
        process.exit(code || 0);
      });
      return;
    }
    
    // For other errors, fail
    console.error("❌ Failed to run migrations. Exiting.");
    process.exit(1);
  }
}

runMigrationsAndStart();

