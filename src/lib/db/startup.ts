import { runMigrations } from "./migrate";
import { seed } from "./seed";

let migrationsRun = false;

export async function runStartupMigrations() {
  if (migrationsRun) {
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log("⚠️  DATABASE_URL not set, skipping migrations");
    return;
  }

  try {
    console.log("🔄 Running startup migrations...");
    await runMigrations();
    console.log("🌱 Running startup seed data...");
    await seed();
    migrationsRun = true;
    console.log("✅ Startup migrations completed");
  } catch (error: any) {
    // Log but don't fail - app can still start
    console.error("⚠️  Startup migration error:", error.message);
    if (error?.message?.includes("already exists") || error?.message?.includes("duplicate")) {
      console.log("ℹ️  Migrations already applied, continuing...");
      migrationsRun = true;
    }
  }
}

