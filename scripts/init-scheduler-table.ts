/**
 * Initialize SchedulerState table
 *
 * Run this script to set up the SchedulerState table if it doesn't exist.
 * This is useful for production deployments that can't run prisma migrate.
 *
 * Usage: npx ts-node scripts/init-scheduler-table.ts
 */

import { db } from '@/lib/db';

async function initSchedulerTable() {
  try {
    console.log('Checking if SchedulerState table exists...');

    // Try to access the table - if it doesn't exist, we'll get an error
    const existing = await db.schedulerState.findUnique({
      where: { id: 'recurring-task-scheduler' }
    }).catch(() => null);

    if (!existing) {
      console.log('Creating SchedulerState record...');
      await db.schedulerState.create({
        data: {
          id: 'recurring-task-scheduler',
          lastRunDate: new Date('2000-01-01'), // Set to past so it runs on next deployment
          isRunning: false,
        }
      });
      console.log('✓ SchedulerState record created successfully');
    } else {
      console.log('✓ SchedulerState record already exists');
    }

    console.log('\nScheduler initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing scheduler table:', error);
    console.error('\nNote: If you see a "P2010" or table not found error, run:');
    console.error('  npx prisma migrate deploy');
    process.exit(1);
  }
}

initSchedulerTable();
