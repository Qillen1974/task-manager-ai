import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, handleApiError } from "@/lib/apiResponse";

/**
 * GET /api/admin/butler-chats/[conversationId] - Retrieve full conversation with all messages (ADMIN ONLY)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
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

    // Get conversation with user and messages
    const conversation = await db.chatConversation.findUnique({
      where: { id: params.conversationId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
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
            role: true,
            content: true,
            modelUsed: true,
            tokensUsed: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return { error: "Conversation not found", status: 404 };
    }

    return success({
      conversation: {
        id: conversation.id,
        title: conversation.title || "Untitled Conversation",
        user: {
          email: conversation.user.email,
          name: conversation.user.name || conversation.user.email,
          id: conversation.user.id,
        },
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messages: conversation.messages,
        messageCount: conversation.messages.length,
      },
    });
  });
}
