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

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  const migrationsFolder = path.join(process.cwd(), "drizzle/migrations");

  if (!fs.existsSync(migrationsFolder)) {
    console.log("No migrations folder found, skipping migration");
    return;
  }

  try {
    console.log("Running migrations from:", migrationsFolder);
    await migrate(db, { migrationsFolder });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Migration error:", error);
    // Don't throw - migrations might already be applied (idempotent)
    if (String(error).includes("already exists") || String(error).includes("duplicate")) {
      console.log("Migration already applied, continuing...");
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
