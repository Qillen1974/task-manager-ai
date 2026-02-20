import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { success, error, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { verifyBotAuth, botHasPermission, botCanAccessProject } from "@/lib/botMiddleware";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/botRateLimit";
import { quadrantToPriority, isValidQuadrant } from "@/lib/botQuadrantMap";
import { formatTaskForBot, formatCommentForBot, formatArtifactForBot } from "@/lib/botResponseFormatter";
import { logBotAction } from "@/lib/botAuditLog";
import { canAccessSubtasks, canAccessPipeline } from "@/lib/projectLimits";

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
        subtasks: {
          include: {
            project: { select: { id: true, name: true, color: true } },
            assignedToBot: { select: { id: true, name: true } },
            _count: { select: { subtasks: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { subtasks: true },
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
      subtasks: task.subtasks.map((st: any) => ({
        ...formatTaskForBot(st),
        assignedToBot: st.assignedToBot ? { id: st.assignedToBot.id, name: st.assignedToBot.name } : null,
      })),
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
    const { title, description, quadrant, progress, completed, status, assignedToBotId } = body;

    // ── Delegation: reassign task to another bot ──
    if (assignedToBotId !== undefined) {
      if (!botHasPermission(bot, "tasks:delegate")) {
        return error("Bot does not have tasks:delegate permission", 403, "BOT_PERMISSION_DENIED");
      }

      // Validate target bot exists, is active, and belongs to same owner
      const targetBot = await db.bot.findUnique({ where: { id: assignedToBotId } });
      if (!targetBot) {
        return error("Target bot not found", 404, "TARGET_BOT_NOT_FOUND");
      }
      if (!targetBot.isActive) {
        return error("Target bot is not active", 400, "TARGET_BOT_INACTIVE");
      }
      if (targetBot.ownerId !== bot.ownerId) {
        return error("Target bot does not belong to the same owner", 403, "TARGET_BOT_WRONG_OWNER");
      }

      const delegated = await db.task.update({
        where: { id: params.taskId },
        data: {
          assignedToBotId,
          progress: 0,
          status: "TODO",
          completed: false,
          completedAt: null,
        },
        include: {
          project: { select: { id: true, name: true, color: true } },
        },
      });

      await logBotAction({
        botId: bot.id,
        ownerId: bot.ownerId,
        action: "TASK_DELEGATED",
        resource: "task",
        resourceId: task.id,
        details: { targetBotId: assignedToBotId, targetBotName: targetBot.name },
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          undefined,
      });

      const headers = getRateLimitHeaders(bot.rateLimitPerMinute, rateLimit.remaining, rateLimit.resetAt);
      const response = success(formatTaskForBot(delegated));
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // Validate status if provided
    const ownerPlan = bot.owner.subscription?.plan || "FREE";
    const validStatuses = canAccessPipeline(ownerPlan)
      ? ["TODO", "IN_PROGRESS", "REVIEW", "TESTING", "DONE"]
      : ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
    if (status !== undefined && !validStatuses.includes(status)) {
      const statusList = validStatuses.join(", ");
      return error(`Invalid status. Use ${statusList}`, 400, "INVALID_STATUS");
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
        _count: {
          select: { subtasks: true },
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
