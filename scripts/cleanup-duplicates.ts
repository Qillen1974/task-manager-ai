import { db } from "../lib/db";

async function cleanupDuplicates() {
  console.log("🧹 Cleaning up duplicate recurring task instances...\n");

  const recurringTasks = await db.task.findMany({
    where: {
      isRecurring: true,
      parentTaskId: null,
    },
    select: { id: true, title: true },
  });

  let totalDuplicatesRemoved = 0;
  const cleanupDetails: Array<{ taskTitle: string; duplicatesRemoved: number }> = [];

  for (const recurringTask of recurringTasks) {
    // Find all instances of this recurring task
    const instances = await db.task.findMany({
      where: {
        parentTaskId: recurringTask.id,
        isRecurring: false,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group instances by their title (which includes the date)
    const instancesByTitle = new Map<string, typeof instances>();
    for (const instance of instances) {
      if (!instancesByTitle.has(instance.title)) {
        instancesByTitle.set(instance.title, []);
      }
      instancesByTitle.get(instance.title)!.push(instance);
    }

    // For each group with duplicates, keep the oldest and delete the rest
    let duplicatesForThisTask = 0;
    for (const [title, duplicates] of instancesByTitle.entries()) {
      if (duplicates.length > 1) {
        // Keep the first (oldest) instance, delete the rest
        const toDelete = duplicates.slice(1);
        for (const duplicate of toDelete) {
          console.log(`   🗑️  Deleting duplicate: "${title}" (ID: ${duplicate.id})`);
          await db.task.delete({ where: { id: duplicate.id } });
          duplicatesForThisTask++;
          totalDuplicatesRemoved++;
        }
        console.log(`   ✅ Removed ${toDelete.length} duplicate(s) of "${title}"`);
      }
    }

    if (duplicatesForThisTask > 0) {
      cleanupDetails.push({
        taskTitle: recurringTask.title,
        duplicatesRemoved: duplicatesForThisTask,
      });
    }
  }

  console.log(`\n✅ Cleanup complete!`);
  console.log(`   Total duplicates removed: ${totalDuplicatesRemoved}`);

  if (cleanupDetails.length > 0) {
    console.log(`\n   Details:`);
    cleanupDetails.forEach((detail) => {
      console.log(`   - "${detail.taskTitle}": ${detail.duplicatesRemoved} duplicate(s) removed`);
    });
  }

  await db.$disconnect();
}

cleanupDuplicates().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
