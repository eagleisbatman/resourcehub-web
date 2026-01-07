import { db } from "./index";
import { sql } from "drizzle-orm";

export async function seed() {
  console.log("Seeding database...");

  try {
    // Idempotent seed - uses onConflictDoNothing to prevent duplicates
    // Using SQL for better conflict handling
    await db.execute(sql`
      INSERT INTO statuses (name, color, "order")
      VALUES 
        ('Planning', '#3B82F6', 1),
        ('Active', '#10B981', 2),
        ('On Hold', '#F59E0B', 3),
        ('Completed', '#6B7280', 4)
      ON CONFLICT (name) DO NOTHING
    `);

    await db.execute(sql`
      INSERT INTO flags (name, color, "order")
      VALUES 
        ('High Priority', '#EF4444', 1),
        ('Client Facing', '#8B5CF6', 2),
        ('Internal', '#6366F1', 3)
      ON CONFLICT (name) DO NOTHING
    `);

    await db.execute(sql`
      INSERT INTO roles (name, description, "order")
      VALUES 
        ('Developer', 'Software developer', 1),
        ('Designer', 'UI/UX designer', 2),
        ('Project Manager', 'Project management', 3),
        ('QA Engineer', 'Quality assurance', 4)
      ON CONFLICT (name) DO NOTHING
    `);

    console.log("Seeding completed!");
  } catch (error) {
    console.error("Seeding error:", error);
    throw error;
  }
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log("Seed script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed script failed:", error);
      process.exit(1);
    });
}

