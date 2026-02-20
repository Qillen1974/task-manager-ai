import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { success, error, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { verifyBotAuth, botHasPermission, botCanAccessProject } from "@/lib/botMiddleware";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/botRateLimit";
import { quadrantToPriority, isValidQuadrant } from "@/lib/botQuadrantMap";
import { formatTaskForBot } from "@/lib/botResponseFormatter";
import { logBotAction } from "@/lib/botAuditLog";
import { canAccessSubtasks } from "@/lib/projectLimits";

/**
 * GET /api/v1/bot/tasks/[taskId]/subtasks - List subtasks of a parent task
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

    // Verify parent task exists and bot has access
    const parentTask = await db.task.findUnique({
      where: { id: params.taskId },
      select: { id: true, projectId: true, userId: true },
    });

    if (!parentTask) {
      return ApiErrors.NOT_FOUND("Task");
    }

    const canAccess = await botCanAccessProject(bot, parentTask.projectId);
    if (!canAccess) {
      return error("Bot cannot access this project", 403, "BOT_PROJECT_ACCESS_DENIED");
    }

    const subtasks = await db.task.findMany({
      where: { subtaskOfId: params.taskId },
      orderBy: { createdAt: "asc" },
      include: {
        project: { select: { id: true, name: true, color: true } },
        assignedToBot: { select: { id: true, name: true } },
        _count: { select: { subtasks: true } },
      },
    });

    const headers = getRateLimitHeaders(bot.rateLimitPerMinute, rateLimit.remaining, rateLimit.resetAt);

    const response = success({
      subtasks: subtasks.map((st) => ({
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
 * POST /api/v1/bot/tasks/[taskId]/subtasks - Create a subtask under a parent task
 */
export async function POST(
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

    // Enterprise check
    const ownerPlan = bot.owner.subscription?.plan || "FREE";
    if (!canAccessSubtasks(ownerPlan)) {
      return error("Subtasks require an ENTERPRISE plan", 403, "ENTERPRISE_REQUIRED");
    }

    // Verify parent task exists and bot has access
    const parentTask = await db.task.findUnique({
      where: { id: params.taskId },
      select: { id: true, projectId: true, userId: true, subtaskOfId: true },
    });

    if (!parentTask) {
      return ApiErrors.NOT_FOUND("Parent task");
    }

    // Prevent nested subtasks (one level deep only)
    if (parentTask.subtaskOfId) {
      return error("Cannot create nested subtasks. Only one level of subtask hierarchy is supported.", 400, "NESTED_SUBTASK_NOT_ALLOWED");
    }

    const canAccess = await botCanAccessProject(bot, parentTask.projectId);
    if (!canAccess) {
      return error("Bot cannot access this project", 403, "BOT_PROJECT_ACCESS_DENIED");
    }

    const body = await request.json();
    const { title, description, quadrant, assignedToBotId } = body;

    if (!title || !title.trim()) {
      return ApiErrors.MISSING_REQUIRED_FIELD("title");
    }

    // Map quadrant to priority
    let priority: string | null = null;
    if (quadrant) {
      if (!isValidQuadrant(quadrant)) {
        return error("Invalid quadrant. Use q1, q2, q3, or q4", 400, "INVALID_QUADRANT");
      }
      priority = quadrantToPriority(quadrant);
    }

    // Validate assignedToBotId if provided
    if (assignedToBotId) {
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
    }

    const subtask = await db.task.create({
      data: {
        userId: parentTask.userId,
        projectId: parentTask.projectId,
        title: title.trim(),
        description: description?.trim() || null,
        priority,
        subtaskOfId: parentTask.id,
        assignedToBotId: assignedToBotId || null,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        _count: { select: { subtasks: true } },
      },
    });

    await logBotAction({
      botId: bot.id,
      ownerId: bot.ownerId,
      action: "SUBTASK_CREATED",
      resource: "task",
      resourceId: subtask.id,
      details: { parentTaskId: parentTask.id, title: subtask.title, assignedToBotId },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
    });

    const headers = getRateLimitHeaders(bot.rateLimitPerMinute, rateLimit.remaining, rateLimit.resetAt);

    const response = success(formatTaskForBot(subtask), 201);

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  });
}
