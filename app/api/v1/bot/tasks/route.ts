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
 * GET /api/v1/bot/tasks - List tasks in bot's scoped projects
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyBotAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const bot = auth.bot!;

    // Rate limit check
    const rateLimit = checkRateLimit(bot.id, bot.rateLimitPerMinute);
    if (!rateLimit.allowed) {
      const headers = getRateLimitHeaders(bot.rateLimitPerMinute, rateLimit.remaining, rateLimit.resetAt);
      return NextResponse.json(
        { success: false, error: { message: "Rate limit exceeded", code: "BOT_RATE_LIMITED" } },
        { status: 429, headers }
      );
    }

    // Permission check
    if (!botHasPermission(bot, "tasks:read")) {
      return error("Bot does not have tasks:read permission", 403, "BOT_PERMISSION_DENIED");
    }

    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const completed = url.searchParams.get("completed");
    const assignedToBot = url.searchParams.get("assignedToBot");
    const statusFilter = url.searchParams.get("status");
    const subtaskOfId = url.searchParams.get("subtaskOfId");
    const cursor = url.searchParams.get("cursor"); // cursor is "createdAt|id"
    const limitParam = url.searchParams.get("limit");
    const limit = Math.min(Math.max(parseInt(limitParam || "50", 10) || 50, 1), 100);

    // Build where clause scoped to bot's projects
    const where: any = {};

    if (assignedToBot === "true") {
      // When fetching tasks assigned to this bot, skip project scoping
      // so tasks in subprojects (not directly in bot.projectIds) are included
      where.assignedToBotId = bot.id;
    } else if (projectId) {
      const canAccess = await botCanAccessProject(bot, projectId);
      if (!canAccess) {
        return error("Bot cannot access this project", 403, "BOT_PROJECT_ACCESS_DENIED");
      }
      where.projectId = projectId;
    } else if (bot.projectIds.length > 0) {
      where.projectId = { in: bot.projectIds };
    } else {
      // Fall back to all owner's projects
      where.userId = bot.ownerId;
    }

    if (completed !== null && completed !== undefined) {
      where.completed = completed === "true";
    }

    if (statusFilter) {
      const validStatuses = ["TODO", "IN_PROGRESS", "REVIEW", "TESTING", "DONE"];
      if (!validStatuses.includes(statusFilter)) {
        return error("Invalid status filter. Use TODO, IN_PROGRESS, REVIEW, TESTING, or DONE", 400, "INVALID_STATUS");
      }
      where.status = statusFilter;
    }

    if (subtaskOfId) {
      where.subtaskOfId = subtaskOfId;
    }

    // Cursor-based pagination
    if (cursor) {
      const [cursorDate, cursorId] = cursor.split("|");
      if (cursorDate && cursorId) {
        where.OR = [
          { createdAt: { lt: new Date(cursorDate) } },
          {
            createdAt: new Date(cursorDate),
            id: { lt: cursorId },
          },
        ];
      }
    }

    const tasks = await db.task.findMany({
      where,
      take: limit + 1, // Fetch one extra to determine if there's a next page
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        project: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: { subtasks: true },
        },
      },
    });

    const hasMore = tasks.length > limit;
    const resultTasks = hasMore ? tasks.slice(0, limit) : tasks;
    const nextCursor =
      hasMore && resultTasks.length > 0
        ? `${resultTasks[resultTasks.length - 1].createdAt.toISOString()}|${resultTasks[resultTasks.length - 1].id}`
        : null;

    const headers = getRateLimitHeaders(bot.rateLimitPerMinute, rateLimit.remaining, rateLimit.resetAt);

    const response = success({
      tasks: resultTasks.map(formatTaskForBot),
      pagination: {
        limit,
        hasMore,
        nextCursor,
      },
    });

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  });
}

/**
 * POST /api/v1/bot/tasks - Create a task
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyBotAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const bot = auth.bot!;

    // Rate limit check
    const rateLimit = checkRateLimit(bot.id, bot.rateLimitPerMinute);
    if (!rateLimit.allowed) {
      const headers = getRateLimitHeaders(bot.rateLimitPerMinute, rateLimit.remaining, rateLimit.resetAt);
      return NextResponse.json(
        { success: false, error: { message: "Rate limit exceeded", code: "BOT_RATE_LIMITED" } },
        { status: 429, headers }
      );
    }

    // Permission check
    if (!botHasPermission(bot, "tasks:write")) {
      return error("Bot does not have tasks:write permission", 403, "BOT_PERMISSION_DENIED");
    }

    const body = await request.json();
    const {
      title,
      description,
      projectId,
      quadrant,
      startDate,
      startTime,
      dueDate,
      dueTime,
      assignToSelf,
      subtaskOfId,
    } = body;

    if (!title || !title.trim()) {
      return ApiErrors.MISSING_REQUIRED_FIELD("title");
    }

    if (!projectId) {
      return ApiErrors.MISSING_REQUIRED_FIELD("projectId");
    }

    // Verify project access
    const canAccess = await botCanAccessProject(bot, projectId);
    if (!canAccess) {
      return error("Bot cannot access this project", 403, "BOT_PROJECT_ACCESS_DENIED");
    }

    // Map quadrant to priority
    let priority: string | null = null;
    if (quadrant) {
      if (!isValidQuadrant(quadrant)) {
        return error(
          "Invalid quadrant. Use q1, q2, q3, or q4",
          400,
          "INVALID_QUADRANT"
        );
      }
      priority = quadrantToPriority(quadrant);
    }

    // Validate subtaskOfId if provided
    if (subtaskOfId) {
      const ownerPlan = bot.owner.subscription?.plan || "FREE";
      if (!canAccessSubtasks(ownerPlan)) {
        return error("Subtasks require an ENTERPRISE plan", 403, "ENTERPRISE_REQUIRED");
      }

      const parentTask = await db.task.findUnique({
        where: { id: subtaskOfId },
        select: { id: true, projectId: true, userId: true, subtaskOfId: true },
      });

      if (!parentTask) {
        return ApiErrors.NOT_FOUND("Parent task");
      }

      // Prevent nested subtasks (one level deep only)
      if (parentTask.subtaskOfId) {
        return error("Cannot create nested subtasks. Only one level of subtask hierarchy is supported.", 400, "NESTED_SUBTASK_NOT_ALLOWED");
      }
    }

    // Validate date logic
    if (startDate && dueDate) {
      const start = new Date(startDate + (startTime ? `T${startTime}` : "T00:00"));
      const due = new Date(dueDate + (dueTime ? `T${dueTime}` : "T23:59"));
      if (due < start) {
        return error("Due date cannot be earlier than start date", 400, "INVALID_DATE_RANGE");
      }
    }

    const task = await db.task.create({
      data: {
        userId: bot.ownerId, // Task belongs to bot's owner
        projectId,
        title: title.trim(),
        description: description?.trim() || null,
        priority,
        startDate: startDate ? new Date(startDate) : null,
        startTime: startTime || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        dueTime: dueTime || null,
        assignedToBotId: assignToSelf ? bot.id : null,
        subtaskOfId: subtaskOfId || null,
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
      action: "TASK_CREATED",
      resource: "task",
      resourceId: task.id,
      details: { title: task.title, projectId },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
    });

    const headers = getRateLimitHeaders(bot.rateLimitPerMinute, rateLimit.remaining, rateLimit.resetAt);

    const response = success(formatTaskForBot(task), 201);

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  });
}
