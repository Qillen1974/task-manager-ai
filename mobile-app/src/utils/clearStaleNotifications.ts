import { notificationService } from '../services/notificationService';
import { apiClient } from '../api/client';

/**
 * Clear all stale notifications and reschedule fresh ones
 * This fixes the issue where notifications remain after tasks are deleted
 */
export async function clearAndRescheduleNotifications() {
  try {
    // Cancel ALL existing notifications
    await notificationService.cancelAllTaskReminders();

    // Fetch current tasks from server
    const tasks = await apiClient.getTasks();

    // Schedule fresh notifications for current tasks
    await notificationService.scheduleRemindersForTasks(tasks);
    await notificationService.updateBadgeForTasks(tasks);

    return {
      success: true,
      totalTasks: tasks.length,
      message: 'All stale notifications cleared and fresh ones scheduled',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
