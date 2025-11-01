/**
 * Script to update all existing completed tasks to have progress: 100
 * This ensures backward compatibility with tasks created before the progress auto-complete feature
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔄 Updating completed tasks to progress: 100...');

    const result = await prisma.task.updateMany({
      where: {
        completed: true,
        progress: {
          lt: 100, // progress less than 100
        },
      },
      data: {
        progress: 100,
      },
    });

    console.log(`✅ Successfully updated ${result.count} tasks`);
    console.log(`   - Tasks updated: ${result.count}`);
    console.log(`   - All completed tasks now have progress: 100`);
  } catch (error) {
    console.error('❌ Error updating tasks:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
