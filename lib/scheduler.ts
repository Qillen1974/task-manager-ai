import cron from 'node-cron';
import { db } from '@/lib/db';
import { generateRecurringTaskInstances, countPendingGenerations } from '@/lib/recurringTaskGenerator';
import { cleanupCompletedTasks } from '@/lib/completedTaskCleanup';
import { processStartDateNotifications, countTasksNeedingNotification } from '@/lib/startDateNotificationJob';

/**
 * Recurring Task Scheduler
 *
 * Automatically triggers recurring task generation on a schedule using node-cron.
 * Uses database to prevent duplicate runs on deployment.
 * Only runs once per day even if deployment happens multiple times.
 */

let schedulerStarted = false;

/**
 * Start the recurring task scheduler
 *
 * Runs the generation check daily at midnight (00:00 UTC)
 * Uses database to prevent duplicate runs on deployment
 *
 * Schedule: "0 0 * * *" means:
 * - 0: at minute 0
 * - 0: at hour 0 (midnight)
 * - *: every day of month
 * - *: every month
 * - *: every day of week
 */
export function startRecurringTaskScheduler() {
  // Prevent multiple scheduler instances in same process
  if (schedulerStarted) {
    console.log('[Scheduler] Recurring task scheduler already started in this process');
    return;
  }

  try {
    // Run recurring task generation daily at midnight UTC
    cron.schedule('0 0 * * *', async () => {
      await runGenerationTask();
    });

    // Run completed task cleanup daily at 2 AM UTC
    cron.schedule('0 2 * * *', async () => {
      await runCleanupTask();
    });

    // Run start date notifications daily at 9 AM UTC
    cron.schedule('0 9 * * *', async () => {
      await runStartDateNotificationTask();
    });

    schedulerStarted = true;
    console.log('[Scheduler] ✓ Recurring task scheduler started (daily at 00:00 UTC)');
    console.log('[Scheduler] ✓ Completed task cleanup scheduler started (daily at 02:00 UTC)');
    console.log('[Scheduler] ✓ Start date notification scheduler started (daily at 09:00 UTC)');

    // Run initial check only if not already run today
    console.log('[Scheduler] Checking if initial generation is needed...');
    runGenerationTask().catch((error) => {
      console.error('[Scheduler] Error in initial generation check:', error);
    });
  } catch (error) {
    console.error('[Scheduler] Failed to start recurring task scheduler:', error);
  }
}

/**
 * Internal function to run the generation task
 * Checks database to prevent duplicate runs on same day
 */
async function runGenerationTask() {
  const timestamp = new Date().toISOString();

  try {
    // Check scheduler state from database
    const schedulerState = await db.schedulerState.findUnique({
      where: { id: 'recurring-task-scheduler' }
    }).catch(() => null);

    // Get today's date at midnight UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Check if already run today
    if (schedulerState?.lastRunDate >= today) {
      console.log(`[Scheduler ${timestamp}] Already ran today at ${schedulerState.lastRunDate.toISOString()}, skipping`);
      return;
    }

    // Mark as running
    await db.schedulerState.upsert({
      where: { id: 'recurring-task-scheduler' },
      create: {
        id: 'recurring-task-scheduler',
        lastRunDate: new Date(),
        isRunning: true,
      },
      update: {
        isRunning: true,
      }
    });

    // Get pending count
    const pendingCount = await countPendingGenerations();

    if (pendingCount === 0) {
      console.log(`[Scheduler ${timestamp}] No pending generations`);
      // Still update lastRunDate even if no tasks
      await db.schedulerState.update({
        where: { id: 'recurring-task-scheduler' },
        data: { isRunning: false, lastRunDate: new Date() }
      });
      return;
    }

    console.log(`[Scheduler ${timestamp}] Running generation for ${pendingCount} task(s)...`);

    // Generate all due recurring tasks
    const result = await generateRecurringTaskInstances();

    // Update scheduler state with result
    const finalState: any = {
      isRunning: false,
      lastRunDate: new Date(),
    };

    if (!result.success && result.errors.length > 0) {
      finalState.lastError = result.errors.slice(0, 3).join('; ');
    }

    await db.schedulerState.update({
      where: { id: 'recurring-task-scheduler' },
      data: finalState
    });

    if (result.success) {
      console.log(`[Scheduler ${timestamp}] ✓ ${result.message}`);
    } else {
      console.warn(`[Scheduler ${timestamp}] ⚠ ${result.message}`);
      if (result.errors.length > 0) {
        console.warn('[Scheduler] Errors:', result.errors);
      }
    }
  } catch (error) {
    console.error(`[Scheduler ${timestamp}] ✗ Generation task failed:`, error);
    // Try to update error state in database
    try {
      await db.schedulerState.update({
        where: { id: 'recurring-task-scheduler' },
        data: {
          isRunning: false,
          lastError: String(error).slice(0, 200)
        }
      }).catch(() => null);
    } catch (stateError) {
      console.error('[Scheduler] Could not update scheduler state:', stateError);
    }
  }
}

/**
 * Stop the scheduler (useful for testing)
 */
export function stopRecurringTaskScheduler() {
  cron.getTasks().forEach((task) => {
    task.stop();
  });
  schedulerStarted = false;
  console.log('[Scheduler] Recurring task scheduler stopped');
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  return {
    started: schedulerStarted,
    tasksCount: cron.getTasks().length,
    nextRuns: cron
      .getTasks()
      .map((task) => ({
        running: task.running,
        status: task.status,
      })),
  };
}

/**
 * Manually trigger a generation run (for testing/debugging)
 */
export async function manuallyTriggerGeneration() {
  console.log('[Scheduler] Manual generation trigger');
  return runGenerationTask();
}

/**
 * Internal function to run the cleanup task
 * Removes completed tasks based on user retention settings
 */
async function runCleanupTask() {
  const timestamp = new Date().toISOString();

  try {
    // Check scheduler state from database
    const schedulerState = await db.schedulerState.findUnique({
      where: { id: 'completed-task-cleanup' }
    }).catch(() => null);

    // Get today's date at midnight UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Check if already run today
    if (schedulerState?.lastRunDate >= today) {
      console.log(`[Cleanup ${timestamp}] Already ran today at ${schedulerState.lastRunDate.toISOString()}, skipping`);
      return;
    }

    // Mark as running
    await db.schedulerState.upsert({
      where: { id: 'completed-task-cleanup' },
      create: {
        id: 'completed-task-cleanup',
        lastRunDate: new Date(),
        isRunning: true,
      },
      update: {
        isRunning: true,
      }
    });

    console.log(`[Cleanup ${timestamp}] Running completed task cleanup...`);

    // Run cleanup
    const result = await cleanupCompletedTasks();

    // Update scheduler state with result
    const finalState: any = {
      isRunning: false,
      lastRunDate: new Date(),
    };

    if (!result.success && result.errors.length > 0) {
      finalState.lastError = result.errors.slice(0, 3).map(e => e.error).join('; ');
    }

    await db.schedulerState.update({
      where: { id: 'completed-task-cleanup' },
      data: finalState
    });

    if (result.success) {
      console.log(`[Cleanup ${timestamp}] ✓ ${result.message}`);
    } else {
      console.warn(`[Cleanup ${timestamp}] ⚠ ${result.message}`);
      if (result.errors.length > 0) {
        console.warn('[Cleanup] Errors:', result.errors);
      }
    }
  } catch (error) {
    console.error(`[Cleanup ${timestamp}] ✗ Cleanup task failed:`, error);
    // Try to update error state in database
    try {
      await db.schedulerState.update({
        where: { id: 'completed-task-cleanup' },
        data: {
          isRunning: false,
          lastError: String(error).slice(0, 200)
        }
      }).catch(() => null);
    } catch (stateError) {
      console.error('[Cleanup] Could not update scheduler state:', stateError);
    }
  }
}

/**
 * Manually trigger a cleanup run (for testing/debugging)
 */
export async function manuallyTriggerCleanup() {
  console.log('[Scheduler] Manual cleanup trigger');
  return runCleanupTask();
}

/**
 * Internal function to run the start date notification task
 * Checks database to prevent duplicate runs on same day
 */
async function runStartDateNotificationTask() {
  const timestamp = new Date().toISOString();

  try {
    // Check scheduler state from database
    const schedulerState = await db.schedulerState.findUnique({
      where: { id: 'start-date-notification' }
    }).catch(() => null);

    // Get today's date at midnight UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Check if already run today
    if (schedulerState?.lastRunDate >= today) {
      console.log(`[StartDateNotification ${timestamp}] Already ran today at ${schedulerState.lastRunDate.toISOString()}, skipping`);
      return;
    }

    // Mark as running
    await db.schedulerState.upsert({
      where: { id: 'start-date-notification' },
      create: {
        id: 'start-date-notification',
        lastRunDate: new Date(),
        isRunning: true,
      },
      update: {
        isRunning: true,
      }
    });

    // Get pending count
    const pendingCount = await countTasksNeedingNotification();

    if (pendingCount === 0) {
      console.log(`[StartDateNotification ${timestamp}] No tasks starting today`);
      // Still update lastRunDate even if no tasks
      await db.schedulerState.update({
        where: { id: 'start-date-notification' },
        data: { isRunning: false, lastRunDate: new Date() }
      });
      return;
    }

    console.log(`[StartDateNotification ${timestamp}] Processing ${pendingCount} task(s) starting today...`);

    // Process start date notifications
    const result = await processStartDateNotifications();

    // Update scheduler state with result
    const finalState: any = {
      isRunning: false,
      lastRunDate: new Date(),
    };

    if (!result.success && result.errors.length > 0) {
      finalState.lastError = result.errors.slice(0, 3).join('; ');
    }

    await db.schedulerState.update({
      where: { id: 'start-date-notification' },
      data: finalState
    });

    if (result.success) {
      console.log(`[StartDateNotification ${timestamp}] ✓ ${result.message}`);
    } else {
      console.warn(`[StartDateNotification ${timestamp}] ⚠ ${result.message}`);
      if (result.errors.length > 0) {
        console.warn('[StartDateNotification] Errors:', result.errors);
      }
    }
  } catch (error) {
    console.error(`[StartDateNotification ${timestamp}] ✗ Notification task failed:`, error);
    // Try to update error state in database
    try {
      await db.schedulerState.update({
        where: { id: 'start-date-notification' },
        data: {
          isRunning: false,
          lastError: String(error).slice(0, 200)
        }
      }).catch(() => null);
    } catch (stateError) {
      console.error('[StartDateNotification] Could not update scheduler state:', stateError);
    }
  }
}

/**
 * Manually trigger start date notifications (for testing/debugging)
 */
export async function manuallyTriggerStartDateNotifications() {
  console.log('[Scheduler] Manual start date notification trigger');
  return runStartDateNotificationTask();
}

/**
 * Alternative: Run generation at a custom schedule
 *
 * Usage example for different frequencies:
 * - Every 30 minutes: `30 * * * *`
 * - Every 4 hours: `0 4 * * *`
 * - Daily at 9 AM: `0 9 * * *`
 */
export function scheduleGenerationTask(cronExpression: string) {
  try {
    cron.schedule(cronExpression, async () => {
      await runGenerationTask();
    });
    console.log(`[Scheduler] Added task with custom schedule: ${cronExpression}`);
  } catch (error) {
    console.error('[Scheduler] Failed to add custom schedule:', error);
  }
}
