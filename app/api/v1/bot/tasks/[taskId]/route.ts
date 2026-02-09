import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { success, error, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { verifyBotAuth, botHasPermission, botCanAccessProject } from "@/lib/botMiddleware";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/botRateLimit";
import { quadrantToPriority, isValidQuadrant } from "@/lib/botQuadrantMap";
import { formatTaskForBot, formatCommentForBot, formatArtifactForBot } from "@/lib/botResponseFormatter";
import { logBotAction } from "@/lib/botAuditLog";

/**
 * GET /api/v1/bot/tasks/[taskId] - Get task details with comments and artifacts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyBotAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const bot = auth.bot!;

    const rateLimit = checkRateLimit(bot.id, bot.rateLimitPerMinute);
    if (!rateLimit.allowed) {
      const headers = getRateLimitHeaders(bot.rateLimitPerMinute, rateLimit.remaining, rateLimit.resetAt);
      return NextResponse.json(
        { success: false, error: { message: "Rate limit exceeded", code: "BOT_RATE_LIMITED" } },
        { status: 429, headers }
      );
    }

    if (!botHasPermission(bot, "tasks:read")) {
      return error("Bot does not have tasks:read permission", 403, "BOT_PERMISSION_DENIED");
    }

    const task = await db.task.findUnique({
      where: { id: params.taskId },
      include: {
        project: {
          select: { id: true, name: true, color: true },
        },
        comments: {
          include: {
            bot: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
          take: 50,
        },
        artifacts: {
          select: {
            id: true,
            taskId: true,
            botId: true,
            fileName: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!task) {
      return ApiErrors.NOT_FOUND("Task");
    }

    // Verify bot can access this task's project
    const canAccess = await botCanAccessProject(bot, task.projectId);
    if (!canAccess) {
      return error("Bot cannot access this project", 403, "BOT_PROJECT_ACCESS_DENIED");
    }

    const headers = getRateLimitHeaders(bot.rateLimitPerMinute, rateLimit.remaining, rateLimit.resetAt);

    const response = success({
      ...formatTaskForBot(task),
      comments: task.comments.map(formatCommentForBot),
      artifacts: task.artifacts.map(formatArtifactForBot),
    });

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  });
}

/**
 * PATCH /api/v1/bot/tasks/[taskId] - Update a task
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyBotAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const bot = auth.bot!;

    const rateLimit = checkRateLimit(bot.id, bot.rateLimitPerMinute);
    if (!rateLimit.allowed) {
      const headers = getRateLimitHeaders(bot.rateLimitPerMinute, rateLimit.remaining, rateLimit.resetAt);
      return NextResponse.json(
        { success: false, error: { message: "Rate limit exceeded", code: "BOT_RATE_LIMITED" } },
        { status: 429, headers }
      );
    }

    if (!botHasPermission(bot, "tasks:write")) {
      return error("Bot does not have tasks:write permission", 403, "BOT_PERMISSION_DENIED");
    }

    const task = await db.task.findUnique({
      where: { id: params.taskId },
    });

    if (!task) {
      return ApiErrors.NOT_FOUND("Task");
    }

    // Bot can update tasks assigned to it OR in its scoped projects
    const isAssigned = task.assignedToBotId === bot.id;
    const canAccess = await botCanAccessProject(bot, task.projectId);

    if (!isAssigned && !canAccess) {
      return error("Bot cannot update this task", 403, "BOT_PERMISSION_DENIED");
    }

    const body = await request.json();
    const { title, description, quadrant, progress, completed } = body;

    // Map quadrant to priority
    let priority: string | undefined;
    if (quadrant !== undefined) {
      if (quadrant === null) {
        priority = undefined; // Clear priority
      } else if (!isValidQuadrant(quadrant)) {
        return error("Invalid quadrant. Use q1, q2, q3, or q4", 400, "INVALID_QUADRANT");
      } else {
        priority = quadrantToPriority(quadrant) || undefined;
      }
    }

    const updated = await db.task.update({
      where: { id: params.taskId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(priority !== undefined && { priority }),
        ...(progress !== undefined && { progress: Math.min(Math.max(progress, 0), 100) }),
        ...(completed !== undefined && {
          completed,
          completedAt: completed ? new Date() : null,
          ...(completed && { progress: 100 }),
        }),
      },
      include: {
        project: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    await logBotAction({
      botId: bot.id,
      ownerId: bot.ownerId,
      action: "TASK_UPDATED",
      resource: "task",
      resourceId: task.id,
      details: { changes: Object.keys(body) },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
    });

    const headers = getRateLimitHeaders(bot.rateLimitPerMinute, rateLimit.remaining, rateLimit.resetAt);

    const response = success(formatTaskForBot(updated));

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  });
}
