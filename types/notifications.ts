/**
 * Notification Types
 */

export type NotificationType =
  | "task_assigned"
  | "team_invitation"
  | "document_uploaded"
  | "sticky_note_received"
  | "task_completed"
  | "task_starting_today";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedTaskId?: string | null;
  relatedTeamId?: string | null;
  relatedDocumentId?: string | null;
  relatedUserId?: string | null;
  isRead: boolean;
  readAt?: string | null;
  sentViaEmail: boolean;
  emailSentAt?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  emailTaskAssignments: boolean;
  emailTeamInvitations: boolean;
  emailDocumentUploads: boolean;
  emailStickyNotes: boolean;
  emailTaskCompletions: boolean;
  inAppTaskAssignments: boolean;
  inAppTeamInvitations: boolean;
  inAppDocumentUploads: boolean;
  inAppStickyNotes: boolean;
  inAppTaskCompletions: boolean;
  inAppTaskStartDate: boolean;
  digestFrequency: "immediate" | "daily" | "weekly" | "never";
  notificationsMuted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

// Icon mapping for notification types
export const notificationTypeIcons: Record<NotificationType, string> = {
  task_assigned: "✅",
  team_invitation: "👥",
  document_uploaded: "📄",
  sticky_note_received: "📝",
  task_completed: "🎉",
  task_starting_today: "🚀",
};

// Color mapping for notification types
export const notificationTypeColors: Record<NotificationType, string> = {
  task_assigned: "bg-blue-50 border-blue-200",
  team_invitation: "bg-purple-50 border-purple-200",
  document_uploaded: "bg-amber-50 border-amber-200",
  sticky_note_received: "bg-yellow-50 border-yellow-200",
  task_completed: "bg-green-50 border-green-200",
  task_starting_today: "bg-indigo-50 border-indigo-200",
};

// Readable labels for notification types
export const notificationTypeLabels: Record<NotificationType, string> = {
  task_assigned: "Task Assignment",
  team_invitation: "Team Invitation",
  document_uploaded: "Document Upload",
  sticky_note_received: "Sticky Note",
  task_completed: "Task Completed",
  task_starting_today: "Task Starting",
};
