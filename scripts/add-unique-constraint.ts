import { db } from "../lib/db";

async function addUniqueConstraint() {
  console.log("🔧 Adding unique constraint to prevent duplicate recurring task instances...\n");

  try {
    // Add unique constraint on (parentTaskId, title) combination
    // This prevents race conditions from creating duplicate instances
    await db.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "Task_parentTaskId_title_unique"
      ON "Task" ("parentTaskId", "title")
      WHERE "parentTaskId" IS NOT NULL;
    `;

    console.log("✅ Unique constraint added successfully!");
    console.log("   Index: Task_parentTaskId_title_unique");
    console.log("   Columns: parentTaskId, title");
    console.log("   Condition: WHERE parentTaskId IS NOT NULL");
    console.log("\nThis constraint ensures that:");
    console.log("- No two task instances can have the same title for the same parent task");
    console.log("- Race conditions cannot create duplicate instances");
    console.log("- Parent tasks (parentTaskId = NULL) are not affected\n");
  } catch (error: any) {
    if (error.code === "42P07" || error.message?.includes("already exists")) {
      console.log("ℹ️  Unique constraint already exists, skipping...");
    } else {
      console.error("❌ Error adding unique constraint:", error);
      throw error;
    }
  } finally {
    await db.$disconnect();
  }
}

addUniqueConstraint().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
