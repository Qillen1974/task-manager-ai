import { OpenAI } from "openai";
import { db } from "@/lib/db";

/**
 * Get the active AI model configuration
 */
export async function getAIConfig() {
  let config = await db.aIButlerConfig.findFirst();

  if (!config) {
    config = await db.aIButlerConfig.create({
      data: {
        activeModel: "openai",
        systemPrompt: getDefaultSystemPrompt(),
        maxTokens: 1000,
        temperature: 0.7,
        enableBugReporting: true,
        enableKBSuggestions: true,
      },
    });
  }

  return config;
}

/**
 * Generate AI response using the configured model
 */
export async function generateAIResponseWithLLM(
  userMessage: string
): Promise<string> {
  try {
    const config = await getAIConfig();

    if (config.activeModel === "openai") {
      return await generateOpenAIResponse(userMessage, config);
    } else if (config.activeModel === "anthropic") {
      // TODO: Implement Anthropic integration
      return await generateOpenAIResponse(userMessage, config);
    } else if (config.activeModel === "gemini") {
      // TODO: Implement Gemini integration
      return await generateOpenAIResponse(userMessage, config);
    } else {
      // Fallback to knowledge base response
      return await generateKnowledgeBaseResponse(userMessage);
    }
  } catch (error) {
    console.error("Error generating AI response:", error);
    // Fallback to knowledge base response if AI fails
    return await generateKnowledgeBaseResponse(userMessage);
  }
}

/**
 * Generate response using OpenAI API
 */
async function generateOpenAIResponse(
  userMessage: string,
  config: any
): Promise<string> {
  if (!config.openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const client = new OpenAI({
    apiKey: config.openaiApiKey,
  });

  try {
    // Get relevant knowledge base articles for context
    const relevantArticles = await db.knowledgeBase.findMany({
      where: {
        isActive: true,
        OR: [
          { keywords: { contains: userMessage, mode: "insensitive" } },
          { title: { contains: userMessage, mode: "insensitive" } },
          { content: { contains: userMessage, mode: "insensitive" } },
        ],
      },
      take: 3,
      orderBy: { priority: "desc" },
    });

    // Build context from knowledge base
    let kbContext = "";
    if (relevantArticles.length > 0) {
      kbContext = "\n\nRelevant Knowledge Base Articles:\n";
      relevantArticles.forEach((article) => {
        kbContext += `\n## ${article.title}\n${article.content}\n`;
      });
    }

    // Get system prompt from config
    const systemPrompt = config.systemPrompt || getDefaultSystemPrompt();

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `${systemPrompt}${kbContext}`,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      max_tokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.7,
    });

    return (
      response.choices[0]?.message?.content ||
      "I apologize, I couldn't generate a response at the moment."
    );
  } catch (error: any) {
    console.error("OpenAI API error:", error.message);
    throw error;
  }
}

/**
 * Fallback: Generate response using knowledge base
 */
async function generateKnowledgeBaseResponse(
  userMessage: string
): Promise<string> {
  const messageLower = userMessage.toLowerCase();

  // Check if user is asking about a bug/error
  const isBugRelated =
    messageLower.includes("bug") ||
    messageLower.includes("error") ||
    messageLower.includes("crash") ||
    messageLower.includes("not working") ||
    messageLower.includes("broken") ||
    messageLower.includes("issue");

  if (isBugRelated) {
    return `I'm sorry you're experiencing an issue. I can help you report this bug so our team can investigate thoroughly.\n\nWould you like to submit a bug report? I'll guide you to provide all the necessary details (what you were doing, what went wrong, screenshots, etc.).\n\nYou can also check the troubleshooting section for common solutions.`;
  }

  // Search knowledge base
  const relevantArticles = await db.knowledgeBase.findMany({
    where: {
      isActive: true,
      OR: [
        { keywords: { contains: messageLower, mode: "insensitive" } },
        { title: { contains: messageLower, mode: "insensitive" } },
        { content: { contains: messageLower, mode: "insensitive" } },
      ],
    },
    take: 3,
    orderBy: { priority: "desc" },
  });

  if (relevantArticles.length > 0) {
    let response = `Great question! I found some helpful resources:\n\n`;
    relevantArticles.forEach((article, index) => {
      response += `${index + 1}. **${article.title}**\n`;
      response += `   Category: ${article.category}\n\n`;
    });
    response +=
      "Would you like me to explain more about any of these topics, or do you have other questions?";
    return response;
  }

  // Default response
  return `I'm here to help! You can ask me about:\n• How to use specific features\n• Getting started with projects and tasks\n• Team collaboration and permissions\n• Subscription plans and upgrades\n• Troubleshooting issues\n• Reporting bugs\n\nWhat would you like to know?`;
}

/**
 * Default system prompt for AI Butler
 */
export function getDefaultSystemPrompt(): string {
  return `You are TaskQuadrant's AI Butler, a helpful assistant for an advanced task management and project planning application.

Your role is to:
1. Help users understand and use features of TaskQuadrant
2. Answer questions about projects, tasks, teams, and workflows
3. Guide users through common workflows
4. Suggest helpful features based on user needs
5. Detect when users report issues and suggest bug reporting
6. Provide context-aware help
7. Be friendly, professional, and concise

Key information about TaskQuadrant:
- FREE Plan: 3 projects, 50 tasks, basic features
- PRO Plan: 5 projects, unlimited tasks, advanced features, recurring tasks, subprojects
- ENTERPRISE Plan: Unlimited everything, team collaboration, custom features

Features include:
- Eisenhower Matrix for task prioritization (Important/Urgent)
- Mind Maps for brainstorming and planning (can be converted to projects)
- Recurring tasks with Daily/Weekly/Monthly/Custom patterns
- Task dependencies and resource allocation
- Team collaboration with role-based access (ADMIN, EDITOR, VIEWER)
- Project hierarchies (subprojects)
- Budget and timeline tracking
- Progress tracking (0-100%)

When users ask questions not in the knowledge base, provide helpful guidance based on your understanding of task management and productivity tools.
Always be helpful, accurate, and friendly.`;
}
