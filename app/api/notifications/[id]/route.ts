import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";

/**
 * GET /api/notifications/[id]
 * Get a single notification
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const notification = await db.notification.findUnique({
      where: { id: params.id },
    });

    if (!notification) {
      return ApiErrors.NOT_FOUND("Notification");
    }

    // Check ownership
    if (notification.userId !== auth.userId) {
      return ApiErrors.FORBIDDEN("You don't have permission to view this notification");
    }

    // Mark as read if not already
    if (!notification.isRead) {
      await db.notification.update({
        where: { id: params.id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    return success(notification);
  });
}

/**
 * DELETE /api/notifications/[id]
 * Delete a notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const notification = await db.notification.findUnique({
      where: { id: params.id },
    });

    if (!notification) {
      return ApiErrors.NOT_FOUND("Notification");
    }

    // Check ownership
    if (notification.userId !== auth.userId) {
      return ApiErrors.FORBIDDEN("You don't have permission to delete this notification");
    }

    await db.notification.delete({
      where: { id: params.id },
    });

    return success(null, "Notification deleted");
  });
}
