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

    const dueDate = new Date(task.dueDate);
    const now = new Date();

    // Don't schedule if the task is already overdue
    if (dueDate < now) return null;

    // Schedule notification for 9 AM on the due date
    const reminderDate = new Date(dueDate);
    reminderDate.setHours(9, 0, 0, 0);

    // If reminder date is in the past, don't schedule
    if (reminderDate < now) return null;

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Task Due Today',
          body: task.title,
          data: { taskId: task.id },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  }

  async cancelTaskReminder(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  async cancelAllTaskReminders(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  async scheduleRemindersForTasks(tasks: Task[]): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    // Cancel all existing reminders first
    await this.cancelAllTaskReminders();

    // Schedule reminders for all tasks with due dates
    for (const task of tasks) {
      if (!task.completed && task.dueDate) {
        await this.scheduleTaskReminder(task);
      }
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
