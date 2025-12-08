import { db } from "../lib/db";

async function checkDuplicates() {
  console.log("🔍 Checking for duplicate recurring task instances...\n");

  // Find all recurring task templates
  const recurringTasks = await db.task.findMany({
    where: {
      isRecurring: true,
      parentTaskId: null,
    },
    select: {
      id: true,
      title: true,
      nextGenerationDate: true,
      lastGeneratedDate: true,
    },
  });

  console.log(`Found ${recurringTasks.length} recurring task templates\n`);

  for (const recurringTask of recurringTasks) {
    console.log(`\n📋 Recurring Task: "${recurringTask.title}"`);
    console.log(`   ID: ${recurringTask.id}`);
    console.log(`   Next Generation: ${recurringTask.nextGenerationDate}`);
    console.log(`   Last Generated: ${recurringTask.lastGeneratedDate}`);

    // Find all instances of this recurring task
    const instances = await db.task.findMany({
      where: {
        parentTaskId: recurringTask.id,
        isRecurring: false,
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        completed: true,
      },
    });

    console.log(`   Total instances: ${instances.length}`);

    // Group instances by their title
    const instancesByTitle = new Map<string, typeof instances>();
    for (const instance of instances) {
      if (!instancesByTitle.has(instance.title)) {
        instancesByTitle.set(instance.title, []);
      }
      instancesByTitle.get(instance.title)!.push(instance);
    }

    // Report duplicates
    let hasDuplicates = false;
    for (const [title, duplicates] of instancesByTitle.entries()) {
      if (duplicates.length > 1) {
        hasDuplicates = true;
        console.log(`\n   ⚠️  DUPLICATE: "${title}" (${duplicates.length} instances)`);
        duplicates.forEach((dup, i) => {
          console.log(
            `      ${i + 1}. ID: ${dup.id} | Created: ${dup.createdAt.toISOString()} | Completed: ${dup.completed}`
          );
        });
      }
    }

    if (!hasDuplicates) {
      console.log("   ✅ No duplicates found");
    }
  }

  await db.$disconnect();
}

checkDuplicates().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
