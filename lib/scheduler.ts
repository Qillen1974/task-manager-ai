import cron from 'node-cron';
import { generateRecurringTaskInstances, countPendingGenerations } from '@/lib/recurringTaskGenerator';

/**
 * Recurring Task Scheduler
 *
 * Automatically triggers recurring task generation on a schedule using node-cron.
 * Runs in the background when the application is running.
 */

let schedulerStarted = false;

/**
 * Start the recurring task scheduler
 *
 * Runs the generation check every hour at minute 0
 * (e.g., 1:00 AM, 2:00 AM, 3:00 AM, etc.)
 *
 * Schedule: "0 * * * *" means:
 * - 0: at minute 0
 * - *: every hour
 * - *: every day of month
 * - *: every month
 * - *: every day of week
 */
export function startRecurringTaskScheduler() {
  // Prevent multiple scheduler instances
  if (schedulerStarted) {
    console.log('[Scheduler] Recurring task scheduler already started');
    return;
  }

  try {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
      await runGenerationTask();
    });

    schedulerStarted = true;
    console.log('[Scheduler] ✓ Recurring task scheduler started (every hour at :00)');

    // Optional: Run immediately on startup to catch any missed generations
    console.log('[Scheduler] Running initial generation check...');
    runGenerationTask().catch((error) => {
      console.error('[Scheduler] Error in initial generation check:', error);
    });
  } catch (error) {
    console.error('[Scheduler] Failed to start recurring task scheduler:', error);
  }
}

/**
 * Internal function to run the generation task
 */
async function runGenerationTask() {
  const timestamp = new Date().toISOString();

  try {
    // Get pending count first
    const pendingCount = await countPendingGenerations();

    if (pendingCount === 0) {
      console.log(`[Scheduler ${timestamp}] No pending generations`);
      return;
    }

    console.log(`[Scheduler ${timestamp}] Running generation for ${pendingCount} task(s)...`);

    // Generate all due recurring tasks
    const result = await generateRecurringTaskInstances();

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
