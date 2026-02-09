import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { success, error, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { verifyBotAuth, botHasPermission, botCanAccessProject } from "@/lib/botMiddleware";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/botRateLimit";
import { formatCommentForBot } from "@/lib/botResponseFormatter";
import { logBotAction } from "@/lib/botAuditLog";

/**
 * GET /api/v1/bot/tasks/[taskId]/comments - List comments
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

    if (!botHasPermission(bot, "comments:read")) {
      return error("Bot does not have comments:read permission", 403, "BOT_PERMISSION_DENIED");
    }

    // Verify task exists and bot can access it
    const task = await db.task.findUnique({
      where: { id: params.taskId },
      select: { id: true, projectId: true },
    });

    if (!task) {
      return ApiErrors.NOT_FOUND("Task");
    }

    const canAccess = await botCanAccessProject(bot, task.projectId);
    if (!canAccess) {
      return error("Bot cannot access this project", 403, "BOT_PROJECT_ACCESS_DENIED");
    }

    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor");
    const limitParam = url.searchParams.get("limit");
    const limit = Math.min(Math.max(parseInt(limitParam || "50", 10) || 50, 1), 100);

    const where: any = { taskId: params.taskId };

    if (cursor) {
      const [cursorDate, cursorId] = cursor.split("|");
      if (cursorDate && cursorId) {
        where.OR = [
          { createdAt: { gt: new Date(cursorDate) } },
          { createdAt: new Date(cursorDate), id: { gt: cursorId } },
        ];
      }
    }

    const comments = await db.taskComment.findMany({
      where,
      take: limit + 1,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      include: {
        bot: { select: { id: true, name: true } },
      },
    });

    const hasMore = comments.length > limit;
    const resultComments = hasMore ? comments.slice(0, limit) : comments;
    const nextCursor =
      hasMore && resultComments.length > 0
        ? `${resultComments[resultComments.length - 1].createdAt.toISOString()}|${resultComments[resultComments.length - 1].id}`
        : null;

    const headers = getRateLimitHeaders(bot.rateLimitPerMinute, rateLimit.remaining, rateLimit.resetAt);

    const response = success({
      comments: resultComments.map(formatCommentForBot),
      pagination: { limit, hasMore, nextCursor },
    });

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  });
}

/**
 * POST /api/v1/bot/tasks/[taskId]/comments - Add a comment
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

    if (!botHasPermission(bot, "comments:write")) {
      return error("Bot does not have comments:write permission", 403, "BOT_PERMISSION_DENIED");
    }

    // Verify task exists and bot can access it
    const task = await db.task.findUnique({
      where: { id: params.taskId },
      select: { id: true, projectId: true },
    });

    if (!task) {
      return ApiErrors.NOT_FOUND("Task");
    }

    const canAccess = await botCanAccessProject(bot, task.projectId);
    if (!canAccess) {
      return error("Bot cannot access this project", 403, "BOT_PROJECT_ACCESS_DENIED");
    }

    const body = await request.json();
    const { body: commentBody, metadata } = body;

    if (!commentBody || !commentBody.trim()) {
      return ApiErrors.MISSING_REQUIRED_FIELD("body");
    }

    const comment = await db.taskComment.create({
      data: {
        taskId: params.taskId,
        botId: bot.id,
        body: commentBody.trim(),
        metadata: metadata || null,
      },
      include: {
        bot: { select: { id: true, name: true } },
      },
    });

    await logBotAction({
      botId: bot.id,
      ownerId: bot.ownerId,
      action: "COMMENT_ADDED",
      resource: "comment",
      resourceId: comment.id,
      details: { taskId: params.taskId },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
    });

    const headers = getRateLimitHeaders(bot.rateLimitPerMinute, rateLimit.remaining, rateLimit.resetAt);

    const response = success(formatCommentForBot(comment), 201);

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  });
}
