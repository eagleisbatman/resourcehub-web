#!/usr/bin/env tsx
import { runMigrations } from "../src/lib/db/migrate";
import { seed } from "../src/lib/db/seed";
import { spawn } from "child_process";

async function runMigrationsAndStart() {
  const connectionString = process.env.DATABASE_URL;
  
  console.log("📦 Current working directory:", process.cwd());
  console.log("🔗 DATABASE_URL:", connectionString ? "✅ Set" : "❌ Not set");
  
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
    // Start Next.js directly (not via npm start to avoid recursion)
    const nextProcess = spawn("next", ["start"], {
      stdio: "inherit",
      shell: true,
    });
    
    nextProcess.on("exit", (code: number) => {
      process.exit(code || 0);
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("❌ Migration error:", errorMessage);
    if (errorStack) {
      console.error("Stack trace:", errorStack);
    }
    
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
      const nextProcess = spawn("next", ["start"], {
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

