"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Trash2, Check, X } from "lucide-react";
import { fetchNotifications, deleteNotification, updateNotificationsStatus } from "@/lib/notificationClient";
import { Notification, notificationTypeIcons, notificationTypeColors, notificationTypeLabels } from "@/types/notifications";
import { formatNotificationDate, getNotificationLink } from "@/lib/notificationClient";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const pageSize = 10;

  // Load notifications
  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetchNotifications(
        pageSize,
        page * pageSize,
        filter === "unread"
      );
      setNotifications(response.notifications);
      setTotalCount(response.pagination.total);
      setError(null);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  // Load notifications on mount or when filter/page changes
  useEffect(() => {
    loadNotifications();
  }, [filter, page]);

  // Handle delete notification
  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (id: string) => {
    try {
      const notification = notifications.find((n) => n.id === id);
      if (notification) {
        await updateNotificationsStatus([id], !notification.isRead);
        setNotifications(
          notifications.map((n) =>
            n.id === id ? { ...n, isRead: !n.isRead } : n
          )
        );
      }
    } catch (err) {
      console.error("Failed to update notification:", err);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter((n) => !n.isRead)
        .map((n) => n.id);

      if (unreadIds.length > 0) {
        await updateNotificationsStatus(unreadIds, true);
        setNotifications(
          notifications.map((n) =>
            unreadIds.includes(n.id) ? { ...n, isRead: true } : n
          )
        );
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedNotifications);
    for (const id of idsToDelete) {
      try {
        await deleteNotification(id);
      } catch (err) {
        console.error("Failed to delete notification:", err);
      }
    }
    setNotifications(notifications.filter((n) => !idsToDelete.includes(n.id)));
    setSelectedNotifications(new Set());
  };

  // Toggle notification selection
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bell size={32} className="text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition"
            >
              Back to Dashboard
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Total Notifications</p>
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Unread</p>
              <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFilter("all");
                  setPage(0);
                }}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
                }`}
              >
                All Notifications
              </button>
              <button
                onClick={() => {
                  setFilter("unread");
                  setPage(0);
                }}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === "unread"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
                }`}
              >
                Unread Only
              </button>
            </div>

            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:border-gray-300 transition flex items-center gap-2"
                >
                  <Check size={18} />
                  Mark All as Read
                </button>
              )}

              {selectedNotifications.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete Selected ({selectedNotifications.size})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadNotifications}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === "unread"
                ? "No Unread Notifications"
                : "No Notifications Yet"}
            </h3>
            <p className="text-gray-600">
              {filter === "unread"
                ? "You're all caught up! Check back later."
                : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          <>
            {/* Notifications List */}
            <div className="space-y-4">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  isSelected={selectedNotifications.has(notification.id)}
                  onToggleSelect={toggleSelection}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-300 transition"
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`px-3 py-2 rounded-lg transition ${
                        page === i
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page === totalPages - 1}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-300 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Individual notification card
 */
function NotificationCard({
  notification,
  isSelected,
  onToggleSelect,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const icon = notificationTypeIcons[notification.type] || "📢";
  const colorClass = notificationTypeColors[notification.type];
  const typeLabel = notificationTypeLabels[notification.type];
  const link = getNotificationLink(notification);

  return (
    <div
      className={`border rounded-lg p-4 transition ${
        isSelected
          ? "bg-blue-50 border-blue-300"
          : `${colorClass} border-gray-200 hover:border-gray-300`
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(notification.id)}
          className="w-4 h-4 mt-1 cursor-pointer"
        />

        {/* Icon and Content */}
        <div className="flex-1 min-w-0">
          <div className="text-2xl mb-2">{icon}</div>

          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{notification.title}</h3>
              <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                {typeLabel}
              </span>
              {!notification.isRead && (
                <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded">
                  Unread
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm break-words">
              {notification.message}
            </p>
            {notification.metadata && (
              <p className="text-xs text-gray-500 mt-2">
                {JSON.stringify(notification.metadata)}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{formatNotificationDate(notification.createdAt)}</span>
            {notification.sentViaEmail && (
              <span className="px-2 py-1 bg-green-50 text-green-700 rounded">
                Email sent
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {link && (
            <Link
              href={link}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition whitespace-nowrap"
            >
              View
            </Link>
          )}

          <button
            onClick={() => onMarkAsRead(notification.id)}
            title={notification.isRead ? "Mark as unread" : "Mark as read"}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded transition"
          >
            {notification.isRead ? (
              <X size={18} />
            ) : (
              <Check size={18} />
            )}
          </button>

          <button
            onClick={() => onDelete(notification.id)}
            title="Delete"
            className="p-2 text-red-600 hover:bg-red-100 rounded transition"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
