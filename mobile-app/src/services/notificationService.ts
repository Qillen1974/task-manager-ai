import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Task } from '../types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private isScheduling = false;

  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('task-reminders', {
        name: 'Task Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
      });
    }

    return true;
  }

  async scheduleTaskReminder(task: Task): Promise<string | null> {
    if (!task.dueDate) return null;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    // Parse the due date - handle both string and Date objects
    const dueDate = typeof task.dueDate === 'string'
      ? new Date(task.dueDate)
      : new Date(task.dueDate);

    const now = new Date();

    // Don't schedule if the task is already overdue
    if (dueDate < now) {
      return null;
    }

    // Schedule notification for 9 AM on the due date (local timezone)
    const reminderDate = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate(),
      9, // 9 AM
      0, // 0 minutes
      0, // 0 seconds
      0  // 0 milliseconds
    );

    // If reminder date is in the past, don't schedule
    if (reminderDate < now) {
      return null;
    }

    try {
      // Use CALENDAR trigger instead of DATE trigger to get absolute dates
      // This prevents the timeInterval conversion issue
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Task Due Today',
          body: task.title,
          data: { taskId: task.id },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          repeats: false,
          year: reminderDate.getFullYear(),
          month: reminderDate.getMonth() + 1, // Calendar months are 1-12, JS months are 0-11
          day: reminderDate.getDate(),
          hour: reminderDate.getHours(),
          minute: reminderDate.getMinutes(),
        },
      });

      return notificationId;
    } catch (error) {
      return null;
    }
  }

  async cancelTaskReminder(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      // Notification cancellation failed - non-critical
    }
  }

  async cancelAllTaskReminders(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      // Notification cancellation failed - non-critical
    }
  }

  async scheduleRemindersForTasks(tasks: Task[]): Promise<void> {
    // Prevent concurrent scheduling operations (race condition protection)
    if (this.isScheduling) {
      return;
    }

    this.isScheduling = true;

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        this.isScheduling = false;
        return;
      }

      // Cancel all existing reminders first
      await this.cancelAllTaskReminders();

      // Wait longer to ensure cancellation completes on iOS
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify all notifications are cleared
      const remaining = await Notifications.getAllScheduledNotificationsAsync();
      if (remaining.length > 0) {
        await this.cancelAllTaskReminders();
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Schedule reminders for all tasks with due dates
      for (const task of tasks) {
        if (!task.completed && task.dueDate) {
          await this.scheduleTaskReminder(task);
        }
      }
    } catch (error) {
      // Notification scheduling failed - non-critical
    } finally {
      this.isScheduling = false;
    }
  }

  async getBadgeCount(): Promise<number> {
    const count = await Notifications.getBadgeCountAsync();
    return count;
  }

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  async updateBadgeForTasks(tasks: Task[]): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueTodayOrOverdue = tasks.filter((task) => {
      if (task.completed || !task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate <= today;
    });

    await this.setBadgeCount(dueTodayOrOverdue.length);
  }
}

export const notificationService = new NotificationService();
