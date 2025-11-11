import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, handleApiError } from "@/lib/apiResponse";

/**
 * GET /api/admin/butler-chats - List all user conversations with filter by date (ADMIN ONLY)
 * Query params: date (YYYY-MM-DD format), page, limit
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: auth.userId },
    });

    if (!user || !user.isAdmin) {
      return { error: "Only admins can view chat logs", status: 403 };
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));
    const skip = (page - 1) * limit;

    // Build date filter
    let dateFilter = {};
    if (dateStr) {
      try {
        // Parse the date string (YYYY-MM-DD)
        const date = new Date(dateStr);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        dateFilter = {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        };
      } catch (err) {
        return { error: "Invalid date format. Use YYYY-MM-DD", status: 400 };
      }
    }

    // Get conversations with user info
    const [conversations, total] = await Promise.all([
      db.chatConversation.findMany({
        where: dateFilter,
        select: {
          id: true,
          title: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          messages: {
            select: {
              id: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.chatConversation.count({
        where: dateFilter,
      }),
    ]);

    // Format response
    const formattedConversations = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title || "Untitled Conversation",
      userEmail: conv.user.email,
      userName: conv.user.name || conv.user.email,
      userId: conv.user.id,
      messageCount: conv.messages.length,
      createdAt: conv.createdAt,
    }));

    return success({
      conversations: formattedConversations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      date: dateStr || "all dates",
    });
  });
}
