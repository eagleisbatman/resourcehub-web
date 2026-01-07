import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create default statuses
  const statuses = await Promise.all([
    prisma.status.upsert({
      where: { name: "Planning" },
      update: {},
      create: {
        name: "Planning",
        color: "#3B82F6",
        order: 1,
      },
    }),
    prisma.status.upsert({
      where: { name: "Active" },
      update: {},
      create: {
        name: "Active",
        color: "#10B981",
        order: 2,
      },
    }),
    prisma.status.upsert({
      where: { name: "On Hold" },
      update: {},
      create: {
        name: "On Hold",
        color: "#F59E0B",
        order: 3,
      },
    }),
    prisma.status.upsert({
      where: { name: "Completed" },
      update: {},
      create: {
        name: "Completed",
        color: "#6B7280",
        order: 4,
      },
    }),
  ]);

  console.log(`Created ${statuses.length} statuses`);

  // Create default flags
  const flags = await Promise.all([
    prisma.flag.upsert({
      where: { name: "High Priority" },
      update: {},
      create: {
        name: "High Priority",
        color: "#EF4444",
        order: 1,
      },
    }),
    prisma.flag.upsert({
      where: { name: "Client Facing" },
      update: {},
      create: {
        name: "Client Facing",
        color: "#8B5CF6",
        order: 2,
      },
    }),
    prisma.flag.upsert({
      where: { name: "Internal" },
      update: {},
      create: {
        name: "Internal",
        color: "#6366F1",
        order: 3,
      },
    }),
  ]);

  console.log(`Created ${flags.length} flags`);

  // Create default roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: "Developer" },
      update: {},
      create: {
        name: "Developer",
        description: "Software developer",
        order: 1,
      },
    }),
    prisma.role.upsert({
      where: { name: "Designer" },
      update: {},
      create: {
        name: "Designer",
        description: "UI/UX designer",
        order: 2,
      },
    }),
    prisma.role.upsert({
      where: { name: "Project Manager" },
      update: {},
      create: {
        name: "Project Manager",
        description: "Project management",
        order: 3,
      },
    }),
    prisma.role.upsert({
      where: { name: "QA Engineer" },
      update: {},
      create: {
        name: "QA Engineer",
        description: "Quality assurance",
        order: 4,
      },
    }),
  ]);

  console.log(`Created ${roles.length} roles`);

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

