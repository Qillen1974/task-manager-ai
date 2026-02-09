import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/adminMiddleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { logBotAction } from "@/lib/botAuditLog";

/**
 * GET /api/v1/admin/bots/[botId] - Get bot details with stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyAdminAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const bot = await db.bot.findUnique({
      where: { id: params.botId },
      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
        apiKeyPrefix: true,
        projectIds: true,
        permissions: true,
        webhookUrl: true,
        rateLimitPerMinute: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!bot) {
      return ApiErrors.NOT_FOUND("Bot");
    }

    // Get stats
    const [taskCount, commentCount, artifactCount] = await Promise.all([
      db.task.count({ where: { assignedToBotId: bot.id } }),
      db.taskComment.count({ where: { botId: bot.id } }),
      db.taskArtifact.count({ where: { botId: bot.id } }),
    ]);

    return success({
      ...bot,
      stats: {
        assignedTasks: taskCount,
        comments: commentCount,
        artifacts: artifactCount,
      },
    });
  });
}

/**
 * PATCH /api/v1/admin/bots/[botId] - Update bot settings
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyAdminAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const bot = await db.bot.findUnique({
      where: { id: params.botId },
    });

    if (!bot) {
      return ApiErrors.NOT_FOUND("Bot");
    }

    const body = await request.json();
    const {
      name,
      description,
      projectIds,
      webhookUrl,
      permissions,
      rateLimitPerMinute,
      isActive,
    } = body;

    const updated = await db.bot.update({
      where: { id: params.botId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(projectIds !== undefined && { projectIds }),
        ...(webhookUrl !== undefined && { webhookUrl: webhookUrl || null }),
        ...(permissions !== undefined && { permissions }),
        ...(rateLimitPerMinute !== undefined && { rateLimitPerMinute }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
        apiKeyPrefix: true,
        projectIds: true,
        permissions: true,
        webhookUrl: true,
        rateLimitPerMinute: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await logBotAction({
      botId: bot.id,
      ownerId: bot.ownerId,
      action: "UPDATED",
      resource: "bot",
      resourceId: bot.id,
      details: { changes: Object.keys(body) },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
    });

    return success(updated);
  });
}

/**
 * DELETE /api/v1/admin/bots/[botId] - Delete a bot
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyAdminAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const bot = await db.bot.findUnique({
      where: { id: params.botId },
    });

    if (!bot) {
      return ApiErrors.NOT_FOUND("Bot");
    }

    await logBotAction({
      botId: bot.id,
      ownerId: bot.ownerId,
      action: "DELETED",
      resource: "bot",
      resourceId: bot.id,
      details: { name: bot.name },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
    });

    await db.bot.delete({
      where: { id: params.botId },
    });

    return success({ message: "Bot deleted" });
  });
}
