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
    const { title, description, quadrant, progress, completed, status } = body;

    // Validate status if provided
    const validStatuses = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
    if (status !== undefined && !validStatuses.includes(status)) {
      return error("Invalid status. Use TODO, IN_PROGRESS, REVIEW, or DONE", 400, "INVALID_STATUS");
    }

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

    // Bidirectional sync between status and completed
    let syncedCompleted = completed;
    let syncedStatus = status;
    let syncedProgress = progress;

    if (status === "DONE") {
      syncedCompleted = true;
      syncedProgress = 100;
    }
    if (completed === true && status === undefined) {
      syncedStatus = "REVIEW";
    }
    if (status !== undefined && status !== "DONE" && task.status === "DONE") {
      syncedCompleted = false;
    }

    const updated = await db.task.update({
      where: { id: params.taskId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(priority !== undefined && { priority }),
        ...(syncedProgress !== undefined && { progress: Math.min(Math.max(syncedProgress, 0), 100) }),
        ...(syncedStatus !== undefined && { status: syncedStatus as any }),
        ...(syncedCompleted !== undefined && {
          completed: syncedCompleted,
          completedAt: syncedCompleted ? new Date() : null,
          ...(syncedCompleted && { progress: 100 }),
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
