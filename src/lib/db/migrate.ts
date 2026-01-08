import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";

export async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  console.log("📁 Current working directory:", process.cwd());
  
  const migrationsFolder = path.join(process.cwd(), "drizzle/migrations");
  console.log("📂 Looking for migrations in:", migrationsFolder);
  console.log("📂 Migrations folder exists:", fs.existsSync(migrationsFolder));

  if (!fs.existsSync(migrationsFolder)) {
    // Try alternative paths
    const altPath1 = path.join(process.cwd(), "..", "drizzle", "migrations");
    const altPath2 = path.join(__dirname, "..", "..", "..", "drizzle", "migrations");
    console.log("⚠️  Migrations folder not found at:", migrationsFolder);
    console.log("⚠️  Trying alternative path 1:", altPath1, "exists:", fs.existsSync(altPath1));
    console.log("⚠️  Trying alternative path 2:", altPath2, "exists:", fs.existsSync(altPath2));
    
    if (fs.existsSync(altPath1)) {
      console.log("✅ Using alternative path 1");
      return await runMigrationsFromPath(altPath1, connectionString);
    } else if (fs.existsSync(altPath2)) {
      console.log("✅ Using alternative path 2");
      return await runMigrationsFromPath(altPath2, connectionString);
    }
    
    throw new Error(`Migrations folder not found at ${migrationsFolder} or alternative paths`);
  }

  return await runMigrationsFromPath(migrationsFolder, connectionString);
}

async function runMigrationsFromPath(migrationsFolder: string, connectionString: string) {
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  try {
    console.log("🔄 Running migrations from:", migrationsFolder);
    await migrate(db, { migrationsFolder });
    console.log("✅ Migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration error:", error);
    // Don't throw - migrations might already be applied (idempotent)
    if (String(error).includes("already exists") || String(error).includes("duplicate")) {
      console.log("ℹ️  Migration already applied, continuing...");
    } else {
      throw error;
    }
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log("Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}
