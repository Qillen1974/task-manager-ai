/**
 * One-time migration script to set TaskStatus based on existing task state.
 *
 * Run AFTER `npx prisma db push`:
 *   npx tsx scripts/migrate-task-status.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting TaskStatus migration...");

  // 1. completed → DONE
  const doneResult = await prisma.task.updateMany({
    where: { completed: true },
    data: { status: "DONE" },
  });
  console.log(`  Set ${doneResult.count} completed tasks to DONE`);

  // 2. progress > 0 AND not completed → IN_PROGRESS
  const inProgressResult = await prisma.task.updateMany({
    where: {
      completed: false,
      progress: { gt: 0 },
    },
    data: { status: "IN_PROGRESS" },
  });
  console.log(`  Set ${inProgressResult.count} in-progress tasks to IN_PROGRESS`);

  // 3. Everything else stays TODO (the default)
  const todoCount = await prisma.task.count({
    where: { status: "TODO" },
  });
  console.log(`  ${todoCount} tasks remain as TODO`);

  console.log("Migration complete!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
