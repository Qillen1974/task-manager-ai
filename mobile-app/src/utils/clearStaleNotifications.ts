import { notificationService } from '../services/notificationService';
import { apiClient } from '../api/client';

/**
 * Clear all stale notifications and reschedule fresh ones
 * This fixes the issue where notifications remain after tasks are deleted
 */
export async function clearAndRescheduleNotifications() {
  try {
    console.log('🧹 Clearing all stale notifications...');

    // Cancel ALL existing notifications
    await notificationService.cancelAllTaskReminders();

    console.log('✅ All notifications cleared');

    // Fetch current tasks from server
    console.log('📥 Fetching current tasks...');
    const tasks = await apiClient.getTasks();

    console.log(`📋 Found ${tasks.length} current tasks`);

    // Schedule fresh notifications for current tasks
    console.log('📅 Scheduling fresh notifications...');
    await notificationService.scheduleRemindersForTasks(tasks);
    await notificationService.updateBadgeForTasks(tasks);

    console.log('✅ Notifications refreshed successfully!');

    return {
      success: true,
      totalTasks: tasks.length,
      message: 'All stale notifications cleared and fresh ones scheduled',
    };
  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
