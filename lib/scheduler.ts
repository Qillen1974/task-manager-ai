import cron from 'node-cron';
import { db } from '@/lib/db';
import { generateRecurringTaskInstances, countPendingGenerations } from '@/lib/recurringTaskGenerator';

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
    // Run once daily at midnight UTC
    cron.schedule('0 0 * * *', async () => {
      await runGenerationTask();
    });

    schedulerStarted = true;
    console.log('[Scheduler] ✓ Recurring task scheduler started (daily at 00:00 UTC)');

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
