import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, handleApiError } from "@/lib/apiResponse";

/**
 * GET /api/butler/config - Get AI Butler configuration
 * Returns the active model configuration (public info only, no API keys)
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    // Get or create default config
    let config = await db.aIButlerConfig.findFirst();

    if (!config) {
      // Create default configuration
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

    return success({
      config: {
        activeModel: config.activeModel,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        enableBugReporting: config.enableBugReporting,
        enableKBSuggestions: config.enableKBSuggestions,
      },
    });
  });
}

/**
 * PATCH /api/butler/config - Update AI Butler configuration (ADMIN only)
 */
export async function PATCH(request: NextRequest) {
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
      return { error: "Only admins can update butler configuration", status: 403 };
    }

    const body = await request.json();
    const {
      activeModel,
      systemPrompt,
      maxTokens,
      temperature,
      enableBugReporting,
      enableKBSuggestions,
      openaiApiKey,
      anthropicApiKey,
      geminiApiKey,
    } = body;

    // Get or create config
    let config = await db.aIButlerConfig.findFirst();

    if (!config) {
      config = await db.aIButlerConfig.create({
        data: {
          activeModel: activeModel || "openai",
          systemPrompt: systemPrompt || getDefaultSystemPrompt(),
          maxTokens: maxTokens || 1000,
          temperature: temperature || 0.7,
          enableBugReporting: enableBugReporting !== false,
          enableKBSuggestions: enableKBSuggestions !== false,
        },
      });
    } else {
      config = await db.aIButlerConfig.update({
        where: { id: config.id },
        data: {
          ...(activeModel && { activeModel }),
          ...(systemPrompt && { systemPrompt }),
          ...(maxTokens !== undefined && { maxTokens }),
          ...(temperature !== undefined && { temperature }),
          ...(enableBugReporting !== undefined && { enableBugReporting }),
          ...(enableKBSuggestions !== undefined && { enableKBSuggestions }),
          // Note: In production, API keys should be encrypted before storing
          ...(openaiApiKey && { openaiApiKey }),
          ...(anthropicApiKey && { anthropicApiKey }),
          ...(geminiApiKey && { geminiApiKey }),
        },
      });
    }

    return success({
      config: {
        activeModel: config.activeModel,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        enableBugReporting: config.enableBugReporting,
        enableKBSuggestions: config.enableKBSuggestions,
      },
      message: "AI Butler configuration updated successfully",
    });
  });
}

/**
 * Default system prompt for AI Butler
 */
function getDefaultSystemPrompt(): string {
  return `You are TaskQuadrant's AI Butler, a helpful assistant for an advanced task management and project planning application.

Your role is to:
1. Help users understand and use features of TaskQuadrant
2. Answer questions about projects, tasks, teams, and workflows
3. Guide users through common workflows
4. Suggest helpful features based on user needs
5. Detect when users report issues and suggest bug reporting
6. Provide context-aware help

Key information about TaskQuadrant:
- FREE Plan: 3 projects, 50 tasks, basic features
- PRO Plan: 5 projects, unlimited tasks, advanced features, recurring tasks, subprojects
- ENTERPRISE Plan: Unlimited everything, team collaboration, custom features

Features:
- Eisenhower Matrix for task prioritization (Important/Urgent)
- Mind Maps for brainstorming and planning (can be converted to projects)
- Recurring tasks with Daily/Weekly/Monthly/Custom patterns
- Task dependencies and resource allocation
- Team collaboration with role-based access (ADMIN, EDITOR, VIEWER)
- Project hierarchies (subprojects)
- Budget and timeline tracking
- Progress tracking (0-100%)

Be friendly, helpful, and professional. If you don't know something, offer to help them report the issue as a bug.`;
}
