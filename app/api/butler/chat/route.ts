import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, handleApiError } from "@/lib/apiResponse";

/**
 * POST /api/butler/chat - Send a message to the AI butler
 * Body: { conversationId?: string, message: string }
 * Response: { response: string, suggestBugReport: boolean }
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const body = await request.json();
    const { conversationId, message } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return { error: "Message is required", status: 400 };
    }

    // Find or create conversation
    let conversation;
    if (conversationId) {
      conversation = await db.chatConversation.findUnique({
        where: { id: conversationId },
      });

      // Verify ownership
      if (!conversation || conversation.userId !== auth.userId) {
        return { error: "Conversation not found", status: 404 };
      }
    } else {
      // Create new conversation
      conversation = await db.chatConversation.create({
        data: {
          userId: auth.userId,
        },
      });
    }

    // Store user message
    await db.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
      },
    });

    // Generate AI response (placeholder for now)
    const aiResponse = await generateAIResponse(message, auth.userId);

    // Store assistant message
    await db.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: aiResponse.response,
      },
    });

    // Update conversation title if it's the first message
    if (!conversation.title) {
      await db.chatConversation.update({
        where: { id: conversation.id },
        data: {
          title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
        },
      });
    }

    return success({
      conversationId: conversation.id,
      response: aiResponse.response,
      suggestBugReport: aiResponse.suggestBugReport,
    });
  });
}

/**
 * Generate AI response (placeholder implementation)
 * In production, this would call OpenAI, Anthropic, or Gemini API
 */
async function generateAIResponse(
  userMessage: string,
  userId: string
): Promise<{ response: string; suggestBugReport: boolean }> {
  const messageLower = userMessage.toLowerCase();

  // Simple keyword-based responses for now
  let response = "";
  let suggestBugReport = false;

  // Check knowledge base for relevant articles
  const relevantArticles = await db.knowledgeBase.findMany({
    where: {
      isActive: true,
      OR: [
        { keywords: { contains: messageLower, mode: "insensitive" } },
        { title: { contains: messageLower, mode: "insensitive" } },
        { content: { contains: messageLower, mode: "insensitive" } },
      ],
    },
    orderBy: { priority: "desc" },
    take: 3,
  });

  // Check if user is asking about a bug/error
  const isBugRelated =
    messageLower.includes("bug") ||
    messageLower.includes("error") ||
    messageLower.includes("crash") ||
    messageLower.includes("not working") ||
    messageLower.includes("broken") ||
    messageLower.includes("issue");

  if (isBugRelated) {
    response =
      "I'm sorry you're experiencing an issue. I can help you report this bug so our team can investigate thoroughly.\n\n" +
      "Would you like to submit a bug report? I'll guide you to provide all the necessary details (what you were doing, what went wrong, screenshots, etc.).\n\n" +
      "You can also check the troubleshooting section for common solutions.";
    suggestBugReport = true;
  } else if (relevantArticles.length > 0) {
    // If we have relevant knowledge base articles, use them
    response = `Great question! I found some helpful resources:\n\n`;
    relevantArticles.forEach((article, index) => {
      const preview = article.content
        .split("\n")[0]
        .substring(0, 80)
        .replace(/^#+\s/, "");
      response += `${index + 1}. **${article.title}**\n`;
      response += `   Category: ${article.category}\n`;
    });
    response +=
      "\n\nWould you like me to explain more about any of these topics, or do you have other questions?";
  } else if (
    messageLower.includes("help") ||
    messageLower.includes("how") ||
    messageLower.includes("guide") ||
    messageLower.includes("start")
  ) {
    response =
      "I'd be happy to help! I can assist you with:\n" +
      "• Getting started with projects and tasks\n" +
      "• Using features like mind maps and recurring tasks\n" +
      "• Setting up team collaboration\n" +
      "• Troubleshooting issues\n" +
      "• Understanding subscription plans\n\n" +
      "What would you like to learn about?";
  } else if (messageLower.includes("feature")) {
    response =
      "TaskQuadrant offers several powerful features:\n" +
      "• **Eisenhower Matrix**: Prioritize tasks by importance and urgency\n" +
      "• **Mind Maps**: Brainstorm and visualize ideas before converting to projects\n" +
      "• **Recurring Tasks**: Automate repetitive work (PRO/ENTERPRISE)\n" +
      "• **Team Collaboration**: Work together with role-based access (PRO/ENTERPRISE)\n" +
      "• **Task Dependencies**: Track task relationships and blocking items\n" +
      "• **Progress Tracking**: Monitor completion rates and statistics\n\n" +
      "Which feature would you like to learn more about?";
  } else if (
    messageLower.includes("subscription") ||
    messageLower.includes("plan") ||
    messageLower.includes("upgrade") ||
    messageLower.includes("pricing")
  ) {
    response =
      "We offer three subscription plans designed to fit different needs:\n\n" +
      "📦 **FREE** - Perfect for individuals\n" +
      "   3 projects, 50 tasks, basic features\n\n" +
      "⭐ **PRO** - For growing teams\n" +
      "   5 projects, unlimited tasks, advanced features, up to 5 team members\n\n" +
      "🚀 **ENTERPRISE** - For large organizations\n" +
      "   Unlimited everything, full team collaboration, custom features\n\n" +
      "Would you like to upgrade your plan, or do you have questions about what's included?";
  } else {
    response =
      "I'm here to help! You can ask me about:\n" +
      "• How to use specific features\n" +
      "• Getting started with projects and tasks\n" +
      "• Team collaboration and permissions\n" +
      "• Subscription plans and upgrades\n" +
      "• Troubleshooting issues\n" +
      "• Reporting bugs\n\n" +
      "What would you like to know?";
  }

  return { response, suggestBugReport };
}

/**
 * GET /api/butler/chat - Get conversation history
 * Query: conversationId (required)
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return { error: "conversationId is required", status: 400 };
    }

    const conversation = await db.chatConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation || conversation.userId !== auth.userId) {
      return { error: "Conversation not found", status: 404 };
    }

    return success({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        messages: conversation.messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.createdAt,
        })),
      },
    });
  });
}
