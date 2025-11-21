/**
 * Client-side notification API utilities
 */

import { Notification, NotificationsResponse, NotificationPreference } from "@/types/notifications";

/**
 * Fetch all notifications for the current user
 */
export async function fetchNotifications(
  limit: number = 20,
  skip: number = 0,
  unreadOnly: boolean = false
): Promise<NotificationsResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    skip: skip.toString(),
    unreadOnly: unreadOnly.toString(),
  });

  const response = await fetch(`/api/notifications?${params}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Get a single notification
 */
export async function fetchNotification(id: string): Promise<Notification> {
  const response = await fetch(`/api/notifications/${id}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch notification: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Mark notifications as read/unread
 */
export async function updateNotificationsStatus(
  notificationIds: string[],
  isRead: boolean
): Promise<{ updatedCount: number }> {
  const response = await fetch("/api/notifications", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      notificationIds,
      isRead,
    }),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to update notifications: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: string): Promise<void> {
  const response = await fetch(`/api/notifications/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete notification: ${response.statusText}`);
  }
}

/**
 * Fetch user's notification preferences
 */
export async function fetchNotificationPreferences(): Promise<NotificationPreference> {
  const response = await fetch("/api/notifications/preferences", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch preferences: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  updates: Partial<NotificationPreference>
): Promise<NotificationPreference> {
  const response = await fetch("/api/notifications/preferences", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to update preferences: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Reset notification preferences to defaults
 */
export async function resetNotificationPreferences(): Promise<NotificationPreference> {
  const response = await fetch("/api/notifications/preferences/reset", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to reset preferences: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Format date for display
 */
export function formatNotificationDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Get notification link based on type and metadata
 */
export function getNotificationLink(notification: Notification): string | null {
  switch (notification.type) {
    case "task_assigned":
    case "task_completed":
      if (notification.relatedTaskId) {
        return `/dashboard/tasks/${notification.relatedTaskId}`;
      }
      break;

    case "team_invitation":
      if (notification.relatedTeamId) {
        return `/teams/${notification.relatedTeamId}`;
      }
      break;

    case "document_uploaded":
      if (notification.relatedTeamId) {
        return `/teams/${notification.relatedTeamId}/workspace`;
      }
      break;

    case "sticky_note_received":
      if (notification.relatedTeamId) {
        return `/teams/${notification.relatedTeamId}/workspace`;
      }
      break;
  }

  return null;
}
