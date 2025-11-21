/**
 * Notification Service
 *
 * Handles creating both in-app and email notifications with preference checking
 */

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/emailService";
import {
  teamInvitationEmailTemplate,
  taskAssignmentEmailTemplate,
  documentUploadEmailTemplate,
  stickyNoteEmailTemplate,
  taskCompletionEmailTemplate,
} from "@/lib/emailTemplates";

export interface NotificationPayload {
  type: "task_assigned" | "team_invitation" | "document_uploaded" | "sticky_note_received" | "task_completed";
  title: string;
  message: string;
  userId: string;
  relatedTaskId?: string;
  relatedTeamId?: string;
  relatedDocumentId?: string;
  relatedUserId?: string;
  metadata?: Record<string, any>;
}

/**
 * Create an in-app notification
 */
export async function createNotification(payload: NotificationPayload) {
  try {
    console.log("[Notification] Creating notification with payload:", {
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
    });

    const notification = await db.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        relatedTaskId: payload.relatedTaskId,
        relatedTeamId: payload.relatedTeamId,
        relatedDocumentId: payload.relatedDocumentId,
        relatedUserId: payload.relatedUserId,
        metadata: payload.metadata,
      },
    });

    console.log("[Notification] Notification created successfully with ID:", notification.id);
    return notification;
  } catch (error) {
    console.error("[Notification] Failed to create in-app notification:", {
      error: error instanceof Error ? error.message : String(error),
      payload: payload,
    });
    throw error;
  }
}

/**
 * Get user's notification preferences (or create defaults)
 */
export async function getNotificationPreferences(userId: string) {
  try {
    let preferences = await db.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Create default preferences
      preferences = await db.notificationPreference.create({
        data: { userId },
      });
    }

    return preferences;
  } catch (error) {
    console.error("[Notification] Failed to get notification preferences:", error);
    throw error;
  }
}

/**
 * Send team invitation notification
 */
export async function sendTeamInvitationNotification(
  invitedEmail: string,
  teamId: string,
  teamName: string,
  inviterName: string,
  role: string,
  invitationToken: string
) {
  try {
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/teams/accept-invitation?token=${invitationToken}`;

    // Try to find user by email to create in-app notification if they exist
    const user = await db.user.findUnique({
      where: { email: invitedEmail },
    });

    if (user) {
      const preferences = await getNotificationPreferences(user.id);

      // Create in-app notification if enabled
      if (preferences.inAppTeamInvitations) {
        await createNotification({
          type: "team_invitation",
          title: `Invited to join ${teamName}`,
          message: `${inviterName} has invited you to join the ${teamName} team.`,
          userId: user.id,
          relatedTeamId: teamId,
          relatedUserId: "", // Will be set by the inviter's ID if needed
          metadata: {
            teamName,
            inviterName,
            role,
          },
        });
      }

      // Send email if enabled
      if (preferences.emailTeamInvitations && user.email) {
        const { html, text } = teamInvitationEmailTemplate(
          user.firstName || "there",
          teamName,
          inviterName,
          invitationLink,
          role
        );

        const emailResult = await sendEmail({
          to: user.email,
          subject: `You're invited to join ${teamName} on TaskQuadrant!`,
          html,
          text,
        });

        if (emailResult.success) {
          // Mark notification as email sent
          const recentNotification = await db.notification.findFirst({
            where: {
              userId: user.id,
              type: "team_invitation",
              relatedTeamId: teamId,
            },
            orderBy: { createdAt: "desc" },
          });

          if (recentNotification) {
            await db.notification.update({
              where: { id: recentNotification.id },
              data: {
                sentViaEmail: true,
                emailSentAt: new Date(),
              },
            });
          }
        }
      }
    } else {
      // User doesn't exist yet - send email anyway for invitation purposes
      const { html, text } = teamInvitationEmailTemplate(
        invitedEmail.split("@")[0],
        teamName,
        inviterName,
        invitationLink,
        role
      );

      await sendEmail({
        to: invitedEmail,
        subject: `You're invited to join ${teamName} on TaskQuadrant!`,
        html,
        text,
      });
    }

    console.log("[Notification] Team invitation sent to:", invitedEmail);
  } catch (error) {
    console.error("[Notification] Failed to send team invitation:", error);
    throw error;
  }
}

/**
 * Send task assignment notification
 */
export async function sendTaskAssignmentNotification(
  assigneeId: string,
  assignerName: string,
  taskId: string,
  taskTitle: string,
  projectName: string,
  dueDate: Date | null,
  role: string
) {
  try {
    const user = await db.user.findUnique({
      where: { id: assigneeId },
      select: { email: true, firstName: true },
    });

    if (!user?.email) {
      console.warn("[Notification] User not found or has no email:", assigneeId);
      return;
    }

    const preferences = await getNotificationPreferences(assigneeId);
    const taskLink = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tasks/${taskId}`;
    const dueDateFormatted = dueDate ? dueDate.toLocaleDateString() : null;

    // Create in-app notification if enabled
    if (preferences.inAppTaskAssignments) {
      await createNotification({
        type: "task_assigned",
        title: `Assigned to: ${taskTitle}`,
        message: `${assignerName} assigned you to the task "${taskTitle}" in ${projectName}.`,
        userId: assigneeId,
        relatedTaskId: taskId,
        metadata: {
          taskTitle,
          projectName,
          role,
          dueDate: dueDateFormatted,
        },
      });
    }

    // Send email if enabled
    if (preferences.emailTaskAssignments) {
      const { html, text } = taskAssignmentEmailTemplate(
        user.firstName || "there",
        assignerName,
        taskTitle,
        projectName,
        dueDateFormatted,
        taskLink,
        role
      );

      const emailResult = await sendEmail({
        to: user.email,
        subject: `You've been assigned: ${taskTitle}`,
        html,
        text,
      });

      if (emailResult.success) {
        // Mark recent notification as email sent
        const recentNotification = await db.notification.findFirst({
          where: {
            userId: assigneeId,
            type: "task_assigned",
            relatedTaskId: taskId,
          },
          orderBy: { createdAt: "desc" },
        });

        if (recentNotification) {
          await db.notification.update({
            where: { id: recentNotification.id },
            data: {
              sentViaEmail: true,
              emailSentAt: new Date(),
            },
          });
        }
      }
    }

    console.log("[Notification] Task assignment sent to:", user.email);
  } catch (error) {
    console.error("[Notification] Failed to send task assignment notification:", error);
    throw error;
  }
}

/**
 * Send document upload notification to team members
 */
export async function sendDocumentUploadNotification(
  uploaderName: string,
  teamId: string,
  teamName: string,
  documentId: string,
  documentName: string,
  excludeUserId?: string
) {
  try {
    // Get all team members
    const teamMembers = await db.teamMember.findMany({
      where: {
        teamId,
        acceptedAt: { not: null }, // Only accepted members
      },
      include: {
        user: true,
      },
    });

    const documentLink = `${process.env.NEXT_PUBLIC_APP_URL}/teams/${teamId}/workspace?doc=${documentId}`;

    for (const member of teamMembers) {
      // Skip the uploader
      if (member.userId === excludeUserId) continue;

      const preferences = await getNotificationPreferences(member.userId);
      const user = member.user;

      // Create in-app notification if enabled
      if (preferences.inAppDocumentUploads) {
        await createNotification({
          type: "document_uploaded",
          title: `${documentName} uploaded`,
          message: `${uploaderName} uploaded "${documentName}" to the ${teamName} workspace.`,
          userId: member.userId,
          relatedTeamId: teamId,
          relatedDocumentId: documentId,
          relatedUserId: "", // Could be set to uploader's ID
          metadata: {
            documentName,
            teamName,
            uploaderName,
          },
        });
      }

      // Send email if enabled
      if (preferences.emailDocumentUploads && user.email) {
        const { html, text } = documentUploadEmailTemplate(
          user.firstName || "there",
          uploaderName,
          teamName,
          documentName,
          documentLink
        );

        const emailResult = await sendEmail({
          to: user.email,
          subject: `New document: ${documentName}`,
          html,
          text,
        });

        if (emailResult.success) {
          // Mark notification as email sent
          const recentNotification = await db.notification.findFirst({
            where: {
              userId: member.userId,
              type: "document_uploaded",
              relatedDocumentId: documentId,
            },
            orderBy: { createdAt: "desc" },
          });

          if (recentNotification) {
            await db.notification.update({
              where: { id: recentNotification.id },
              data: {
                sentViaEmail: true,
                emailSentAt: new Date(),
              },
            });
          }
        }
      }
    }

    console.log("[Notification] Document upload notification sent to team:", teamName);
  } catch (error) {
    console.error("[Notification] Failed to send document upload notification:", error);
    throw error;
  }
}

/**
 * Send sticky note notification
 */
export async function sendStickyNoteNotification(
  recipientId: string,
  senderId: string,
  teamId: string,
  teamName: string,
  noteContent: string
) {
  try {
    console.log("[Notification] Starting sticky note notification for:", recipientId);

    const sender = await db.user.findUnique({
      where: { id: senderId },
      select: { firstName: true, lastName: true },
    });
    console.log("[Notification] Sender lookup result:", sender);

    const recipient = await db.user.findUnique({
      where: { id: recipientId },
      select: { email: true, firstName: true },
    });
    console.log("[Notification] Recipient lookup result:", recipient);

    if (!recipient?.email) {
      console.warn("[Notification] Recipient not found or has no email:", recipientId);
      return;
    }

    const senderName = sender?.firstName && sender?.lastName ? `${sender.firstName} ${sender.lastName}`.trim() : (sender?.firstName ? sender.firstName : "A team member");
    console.log("[Notification] Fetching preferences for recipient:", recipientId);
    const preferences = await getNotificationPreferences(recipientId);
    console.log("[Notification] Preferences retrieved:", {
      inAppStickyNotes: preferences.inAppStickyNotes,
      emailStickyNotes: preferences.emailStickyNotes,
    });

    const notesLink = `${process.env.NEXT_PUBLIC_APP_URL}/teams/${teamId}/workspace`;

    // Create in-app notification if enabled
    if (preferences.inAppStickyNotes) {
      console.log("[Notification] Creating in-app notification");
      await createNotification({
        type: "sticky_note_received",
        title: `Message from ${senderName}`,
        message: `${senderName} sent you a message.`,
        userId: recipientId,
        relatedTeamId: teamId,
        relatedUserId: senderId,
        metadata: {
          senderName,
          teamName,
          noteContent: noteContent.substring(0, 100), // Store preview
        },
      });
      console.log("[Notification] In-app notification created successfully");
    } else {
      console.log("[Notification] In-app sticky note notifications disabled for user");
    }

    // Send email if enabled
    if (preferences.emailStickyNotes) {
      const { html, text } = stickyNoteEmailTemplate(
        recipient.firstName || "there",
        senderName,
        noteContent,
        teamName,
        notesLink
      );

      const emailResult = await sendEmail({
        to: recipient.email,
        subject: `Message from ${senderName}`,
        html,
        text,
      });

      if (emailResult.success) {
        // Mark notification as email sent
        const recentNotification = await db.notification.findFirst({
          where: {
            userId: recipientId,
            type: "sticky_note_received",
            relatedUserId: senderId,
          },
          orderBy: { createdAt: "desc" },
        });

        if (recentNotification) {
          await db.notification.update({
            where: { id: recentNotification.id },
            data: {
              sentViaEmail: true,
              emailSentAt: new Date(),
            },
          });
        }
      }
    }

    console.log("[Notification] Sticky note notification sent to:", recipient.email);
  } catch (error) {
    console.error("[Notification] Failed to send sticky note notification:", error);
    throw error;
  }
}

/**
 * Send task completion notification
 */
export async function sendTaskCompletionNotification(
  taskAssignmentIds: string[],
  completerId: string,
  taskId: string,
  taskTitle: string,
  projectName: string
) {
  try {
    const completer = await db.user.findUnique({
      where: { id: completerId },
      select: { firstName: true, lastName: true },
    });

    const completerName = completer ? `${completer.firstName} ${completer.lastName}`.trim() : "A team member";
    const taskLink = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tasks/${taskId}`;

    // Get all assignees
    const assignments = await db.taskAssignment.findMany({
      where: {
        id: { in: taskAssignmentIds },
      },
      include: {
        user: true,
      },
    });

    for (const assignment of assignments) {
      const user = assignment.user;
      const preferences = await getNotificationPreferences(user.id);

      // Skip if task was completed by the assignee (no need to notify)
      if (user.id === completerId) continue;

      // Create in-app notification if enabled
      if (preferences.inAppTaskCompletions) {
        await createNotification({
          type: "task_completed",
          title: `${taskTitle} completed`,
          message: `${completerName} completed the task "${taskTitle}" in ${projectName}.`,
          userId: user.id,
          relatedTaskId: taskId,
          relatedUserId: completerId,
          metadata: {
            taskTitle,
            projectName,
            completerName,
          },
        });
      }

      // Send email if enabled
      if (preferences.emailTaskCompletions && user.email) {
        const { html, text } = taskCompletionEmailTemplate(
          user.firstName || "there",
          completerName,
          taskTitle,
          projectName,
          taskLink
        );

        const emailResult = await sendEmail({
          to: user.email,
          subject: `Task completed: ${taskTitle}`,
          html,
          text,
        });

        if (emailResult.success) {
          // Mark notification as email sent
          const recentNotification = await db.notification.findFirst({
            where: {
              userId: user.id,
              type: "task_completed",
              relatedTaskId: taskId,
            },
            orderBy: { createdAt: "desc" },
          });

          if (recentNotification) {
            await db.notification.update({
              where: { id: recentNotification.id },
              data: {
                sentViaEmail: true,
                emailSentAt: new Date(),
              },
            });
          }
        }
      }
    }

    console.log("[Notification] Task completion notifications sent");
  } catch (error) {
    console.error("[Notification] Failed to send task completion notification:", error);
    throw error;
  }
}
