import { db } from "./index";
import { statuses, flags, roles } from "./schema";

export async function seed() {
  console.log("Seeding database...");

  try {
    // Idempotent seed - uses onConflictDoNothing to prevent duplicates
    // Using Drizzle insert API so IDs are auto-generated via $defaultFn
    await db
      .insert(statuses)
      .values([
        { name: "Planning", color: "#3B82F6", order: 1 },
        { name: "Active", color: "#10B981", order: 2 },
        { name: "On Hold", color: "#F59E0B", order: 3 },
        { name: "Completed", color: "#6B7280", order: 4 },
      ])
      .onConflictDoNothing({ target: statuses.name });

    await db
      .insert(flags)
      .values([
        { name: "High Priority", color: "#EF4444", order: 1 },
        { name: "Client Facing", color: "#8B5CF6", order: 2 },
        { name: "Internal", color: "#6366F1", order: 3 },
      ])
      .onConflictDoNothing({ target: flags.name });

    await db
      .insert(roles)
      .values([
        { name: "Developer", description: "Software developer", order: 1 },
        { name: "Designer", description: "UI/UX designer", order: 2 },
        { name: "Project Manager", description: "Project management", order: 3 },
        { name: "QA Engineer", description: "Quality assurance", order: 4 },
      ])
      .onConflictDoNothing({ target: roles.name });

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

