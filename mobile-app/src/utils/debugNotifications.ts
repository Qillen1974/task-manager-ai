import * as Notifications from 'expo-notifications';

/**
 * Debug utility to inspect all scheduled notifications
 * Shows what's actually scheduled and when
 * Only logs output in development mode
 */
export async function debugScheduledNotifications() {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

    if (__DEV__) {
      console.log(`\n📋 Total scheduled notifications: ${scheduledNotifications.length}\n`);
    }

    if (scheduledNotifications.length === 0) {
      if (__DEV__) {
        console.log('No notifications scheduled');
      }
      return {
        total: 0,
        notifications: [],
      };
    }

    const notificationDetails = scheduledNotifications.map((notification, index) => {
      const trigger = notification.trigger as any;

      // Debug: Log the raw trigger to see what we're getting
      if (__DEV__) {
        console.log(`[Debug] Notification "${notification.content.body}":`, JSON.stringify(trigger, null, 2));
      }

      let scheduledDate: Date | null = null;

      try {
        if (trigger.type === 'calendar') {
          // Calendar trigger: { year, month, day, hour, minute }
          // For calendar triggers with dateComponents
          const dateComp = trigger.dateComponents || trigger;
          scheduledDate = new Date(
            dateComp.year || trigger.year,
            (dateComp.month || trigger.month) - 1, // Calendar months are 1-12, JS months are 0-11
            dateComp.day || trigger.day,
            dateComp.hour || trigger.hour || 0,
            dateComp.minute || trigger.minute || 0,
            0,
            0
          );
        } else if (trigger.type === 'timeInterval') {
          // TimeInterval trigger: relative seconds from now
          const now = Date.now();
          const futureTime = now + (trigger.seconds * 1000);
          scheduledDate = new Date(futureTime);

          // Validate the date is reasonable (not more than 10 years in future)
          if (!isFinite(scheduledDate.getTime()) || scheduledDate.getFullYear() > 2100) {
            scheduledDate = null;
          }
        } else if (trigger.type === 'date') {
          // Date trigger (legacy)
          if (typeof trigger.value === 'number') {
            scheduledDate = trigger.value < 10000000000
              ? new Date(trigger.value * 1000)
              : new Date(trigger.value);
          } else if (typeof trigger.value === 'string') {
            scheduledDate = new Date(trigger.value);
          } else if (trigger.value instanceof Date) {
            scheduledDate = trigger.value;
          } else if (trigger.date) {
            scheduledDate = new Date(trigger.date);
          }
        }
      } catch (error) {
        scheduledDate = null;
      }

      return {
        index: index + 1,
        id: notification.identifier,
        title: notification.content.title,
        body: notification.content.body,
        scheduledDate: scheduledDate ? scheduledDate.toISOString() : 'Unknown',
        scheduledDateLocal: scheduledDate ? scheduledDate.toLocaleString() : 'Unknown',
        triggerType: trigger.type,
        rawTriggerValue: trigger.value,
      };
    });

    // Group by scheduled date
    const groupedByDate: Record<string, typeof notificationDetails> = {};

    notificationDetails.forEach(notif => {
      const dateKey = notif.scheduledDate.split('T')[0]; // YYYY-MM-DD
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(notif);
    });

    if (__DEV__) {
      console.log('📅 Notifications grouped by date:');
      Object.entries(groupedByDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([date, notifs]) => {
          console.log(`\n${date}: ${notifs.length} notifications`);
          notifs.forEach(n => {
            console.log(`  - ${n.body} (${n.scheduledDateLocal})`);
          });
        });
    }

    return {
      total: scheduledNotifications.length,
      notifications: notificationDetails,
      groupedByDate,
    };
  } catch (error) {
    return {
      total: 0,
      notifications: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get a summary of scheduled notifications for display in UI
 */
export async function getNotificationSummary(): Promise<string> {
  const debug = await debugScheduledNotifications();

  if (debug.error) {
    return `Error: ${debug.error}`;
  }

  if (debug.total === 0) {
    return 'No notifications scheduled';
  }

  const lines = [`Total: ${debug.total} scheduled\n`];

  if (debug.groupedByDate) {
    const sorted = Object.entries(debug.groupedByDate)
      .sort(([a], [b]) => a.localeCompare(b));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    sorted.forEach(([date, notifs]) => {
      const isToday = date === todayStr;
      const marker = isToday ? ' ← TODAY' : '';
      lines.push(`\n${date}${marker}:`);

      // Show first 3 tasks for this date
      notifs.slice(0, 3).forEach(n => {
        const shortBody = n.body.length > 30 ? n.body.substring(0, 30) + '...' : n.body;
        lines.push(`  • ${shortBody}`);
      });

      if (notifs.length > 3) {
        lines.push(`  ... and ${notifs.length - 3} more`);
      }
    });
  }

  return lines.join('\n');
}

/**
 * Search for a specific task in scheduled notifications
 */
export async function findTaskInNotifications(searchTerm: string): Promise<string> {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

    const matching = scheduledNotifications.filter(notif =>
      notif.content.body?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (matching.length === 0) {
      return `No notifications found for "${searchTerm}"`;
    }

    const results = matching.map(notif => {
      const trigger = notif.trigger as any;

      let scheduledDate: Date | null = null;

      try {
        if (trigger.type === 'calendar') {
          const dateComp = trigger.dateComponents || trigger;
          scheduledDate = new Date(
            dateComp.year || trigger.year,
            (dateComp.month || trigger.month) - 1,
            dateComp.day || trigger.day,
            dateComp.hour || trigger.hour || 0,
            dateComp.minute || trigger.minute || 0,
            0,
            0
          );
        } else if (trigger.type === 'timeInterval') {
          const now = Date.now();
          const futureTime = now + (trigger.seconds * 1000);
          scheduledDate = new Date(futureTime);

          if (!isFinite(scheduledDate.getTime()) || scheduledDate.getFullYear() > 2100) {
            scheduledDate = null;
          }
        } else if (trigger.type === 'date') {
          if (typeof trigger.value === 'number') {
            scheduledDate = trigger.value < 10000000000
              ? new Date(trigger.value * 1000)
              : new Date(trigger.value);
          } else if (typeof trigger.value === 'string') {
            scheduledDate = new Date(trigger.value);
          } else if (trigger.value instanceof Date) {
            scheduledDate = trigger.value;
          } else if (trigger.date) {
            scheduledDate = new Date(trigger.date);
          }
        }
      } catch (error) {
        scheduledDate = null;
      }

      return `"${notif.content.body}"
Scheduled: ${scheduledDate ? scheduledDate.toLocaleString() : 'Unknown'}
Trigger type: ${trigger.type}
Raw trigger: ${JSON.stringify(trigger)}`;
    });

    return results.join('\n\n');
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : 'Unknown'}`;
  }
}
