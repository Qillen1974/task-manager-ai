/**
 * Start Date Notification Job
 *
 * Scheduled job that sends notifications for tasks starting today.
 * Runs daily at 9 AM UTC to notify users about tasks with start dates.
 */

import { db } from "@/lib/db";
import { sendTaskStartDateNotification } from "@/lib/notificationService";

export interface StartDateNotificationResult {
  success: boolean;
  message: string;
  tasksProcessed: number;
  notificationsSent: number;
  errors: string[];
}

/**
 * Process start date notifications for all tasks starting today
 */
export async function processStartDateNotifications(): Promise<StartDateNotificationResult> {
  const timestamp = new Date().toISOString();
  console.log(`[StartDateNotification ${timestamp}] Starting notification job...`);

  const result: StartDateNotificationResult = {
    success: true,
    message: "",
    tasksProcessed: 0,
    notificationsSent: 0,
    errors: [],
  };

  try {
    // Get today's date at midnight UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Get tomorrow's date at midnight UTC
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    // Find all tasks where:
    // - startDate is today
    // - startDateNotificationSent is false
    // - task is not completed
    const tasksStartingToday = await db.task.findMany({
      where: {
        startDate: {
          gte: today,
          lt: tomorrow,
        },
        startDateNotificationSent: false,
        completed: false,
      },
      include: {
        user: {
          select: {
            id: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
              },
            },
          },
        },
        project: {
          select: {
            teamId: true,
          },
        },
      },
    });

    console.log(`[StartDateNotification ${timestamp}] Found ${tasksStartingToday.length} tasks starting today`);
    result.tasksProcessed = tasksStartingToday.length;

    // Process each task
    for (const task of tasksStartingToday) {
      try {
        const usersToNotify = new Set<string>();

        // For personal tasks, notify the owner
        usersToNotify.add(task.userId);

        // For team tasks (tasks with assignments), also notify assignees
        if (task.assignments && task.assignments.length > 0) {
          for (const assignment of task.assignments) {
            usersToNotify.add(assignment.userId);
          }
        }

        // Send notifications to all relevant users
        for (const userId of usersToNotify) {
          try {
            await sendTaskStartDateNotification(
              userId,
              task.id,
              task.title,
              task.startTime
            );
            result.notificationsSent++;
          } catch (notificationError) {
            const errorMessage = `Failed to notify user ${userId} for task ${task.id}: ${notificationError instanceof Error ? notificationError.message : String(notificationError)}`;
            console.error(`[StartDateNotification ${timestamp}] ${errorMessage}`);
            result.errors.push(errorMessage);
          }
        }

        // Mark task as notification sent
        await db.task.update({
          where: { id: task.id },
          data: { startDateNotificationSent: true },
        });
      } catch (taskError) {
        const errorMessage = `Failed to process task ${task.id}: ${taskError instanceof Error ? taskError.message : String(taskError)}`;
        console.error(`[StartDateNotification ${timestamp}] ${errorMessage}`);
        result.errors.push(errorMessage);
        result.success = false;
      }
    }

    // Set final message
    if (result.errors.length > 0) {
      result.success = false;
      result.message = `Processed ${result.tasksProcessed} tasks with ${result.errors.length} errors. Sent ${result.notificationsSent} notifications.`;
    } else if (result.tasksProcessed === 0) {
      result.message = "No tasks starting today.";
    } else {
      result.message = `Successfully processed ${result.tasksProcessed} tasks. Sent ${result.notificationsSent} notifications.`;
    }

    console.log(`[StartDateNotification ${timestamp}] ${result.message}`);
    return result;
  } catch (error) {
    const errorMessage = `Job failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`[StartDateNotification ${timestamp}] ${errorMessage}`);
    result.success = false;
    result.message = errorMessage;
    result.errors.push(errorMessage);
    return result;
  }
}

/**
 * Count tasks that need start date notifications
 */
export async function countTasksNeedingNotification(): Promise<number> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const count = await db.task.count({
    where: {
      startDate: {
        gte: today,
        lt: tomorrow,
      },
      startDateNotificationSent: false,
      completed: false,
    },
  });

  return count;
}
