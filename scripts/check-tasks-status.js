/**
 * Script to check the current status of tasks and their progress values
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('📊 Checking task status and progress values...\n');

    const allTasks = await prisma.task.findMany({
      select: {
        id: true,
        title: true,
        completed: true,
        progress: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Total tasks: ${allTasks.length}\n`);

    const completedTasks = allTasks.filter((t) => t.completed);
    const incompleteTasks = allTasks.filter((t) => !t.completed);

    console.log(`✅ Completed tasks (${completedTasks.length}):`);
    completedTasks.forEach((task) => {
      console.log(
        `   - ${task.title.substring(0, 40).padEnd(40)} | Progress: ${task.progress}%`
      );
    });

    console.log(`\n⏳ Incomplete tasks (${incompleteTasks.length}):`);
    incompleteTasks.slice(0, 5).forEach((task) => {
      console.log(
        `   - ${task.title.substring(0, 40).padEnd(40)} | Progress: ${task.progress}%`
      );
    });
    if (incompleteTasks.length > 5) {
      console.log(`   ... and ${incompleteTasks.length - 5} more`);
    }

    // Summary
    console.log('\n📈 Summary:');
    const completedWith100 = completedTasks.filter((t) => t.progress === 100).length;
    const completedWithLess = completedTasks.filter((t) => t.progress < 100).length;
    console.log(`   - Completed tasks with 100% progress: ${completedWith100}`);
    console.log(`   - Completed tasks with < 100% progress: ${completedWithLess}`);
  } catch (error) {
    console.error('❌ Error checking tasks:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
