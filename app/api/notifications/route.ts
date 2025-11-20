import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";

/**
 * GET /api/notifications
 * Get user's notifications with pagination
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = parseInt(searchParams.get("skip") || "0");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    // Get notifications
    const notifications = await db.notification.findMany({
      where: {
        userId: auth.userId,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    });

    // Get total count for pagination
    const total = await db.notification.count({
      where: {
        userId: auth.userId,
        ...(unreadOnly && { isRead: false }),
      },
    });

    return success({
      notifications,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    });
  });
}

/**
 * PATCH /api/notifications
 * Mark notifications as read/unread in bulk
 */
export async function PATCH(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const body = await request.json();
    const { notificationIds, isRead } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return ApiErrors.INVALID_INPUT("notificationIds must be an array");
    }

    if (typeof isRead !== "boolean") {
      return ApiErrors.INVALID_INPUT("isRead must be a boolean");
    }

    // Update notifications (only for the authenticated user)
    const updated = await db.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: auth.userId,
      },
      data: {
        isRead,
        readAt: isRead ? new Date() : null,
      },
    });

    return success({
      updatedCount: updated.count,
    });
  });
}
