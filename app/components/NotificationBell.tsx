"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { fetchNotifications } from "@/lib/notificationClient";
import { Notification } from "@/types/notifications";
import { notificationTypeIcons } from "@/types/notifications";

interface NotificationBellProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function NotificationBell({
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load notifications
  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetchNotifications(5, 0, false); // Get 5 most recent
      setNotifications(response.notifications);
      const unread = response.notifications.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
      setError(null);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  // Auto-refresh notifications
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadNotifications();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={24} />

        {/* Badge showing unread count */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500 text-sm">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClose={() => setIsOpen(false)}
                    onRefresh={loadNotifications}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-200 p-3">
              <Link
                href="/notifications"
                className="block w-full text-center py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                onClick={() => setIsOpen(false)}
              >
                View All Notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Individual notification item in dropdown
 */
function NotificationItem({
  notification,
  onClose,
  onRefresh,
}: {
  notification: Notification;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const icon = notificationTypeIcons[notification.type] || "📢";

  const handleClick = () => {
    const link = getNotificationLink(notification);
    if (link) {
      onClose();
      window.location.href = link;
    }
  };

  return (
    <div
      className={`p-3 hover:bg-gray-50 cursor-pointer transition ${
        !notification.isRead ? "bg-blue-50" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="text-xl mt-1">{icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm truncate">
            {notification.title}
          </h4>
          <p className="text-gray-600 text-xs mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-gray-400 text-xs mt-2">
            {formatDate(notification.createdAt)}
          </p>
        </div>

        {!notification.isRead && (
          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
        )}
      </div>
    </div>
  );
}

/**
 * Format relative date for display
 */
function formatDate(dateString: string): string {
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
function getNotificationLink(notification: Notification): string | null {
  switch (notification.type) {
    case "task_assigned":
    case "task_completed":
      if (notification.relatedTaskId) {
        return `/dashboard/tasks/${notification.relatedTaskId}`;
      }
      break;

    case "team_invitation":
      if (notification.relatedTeamId) {
        return `/dashboard/teams/${notification.relatedTeamId}`;
      }
      break;

    case "document_uploaded":
    case "sticky_note_received":
      if (notification.relatedTeamId) {
        return `/dashboard/teams/${notification.relatedTeamId}`;
      }
      break;
  }

  return null;
}
