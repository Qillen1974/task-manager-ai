import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { success, error, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { verifyBotAuth, botHasPermission, botCanAccessProject } from "@/lib/botMiddleware";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/botRateLimit";
import { formatArtifactForBot } from "@/lib/botResponseFormatter";
import { logBotAction } from "@/lib/botAuditLog";

const MAX_ARTIFACT_SIZE = 1_000_000; // 1MB

/**
 * GET /api/v1/bot/tasks/[taskId]/artifacts - List artifacts
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
      select: { id: true, projectId: true },
    });

    if (!task) {
      return ApiErrors.NOT_FOUND("Task");
    }

    const canAccess = await botCanAccessProject(bot, task.projectId);
    if (!canAccess) {
      return error("Bot cannot access this project", 403, "BOT_PROJECT_ACCESS_DENIED");
    }

    const artifacts = await db.taskArtifact.findMany({
      where: { taskId: params.taskId },
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
    });

    const headers = getRateLimitHeaders(bot.rateLimitPerMinute, rateLimit.remaining, rateLimit.resetAt);

    const response = success({
      artifacts: artifacts.map(formatArtifactForBot),
    });

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  });
}

/**
 * POST /api/v1/bot/tasks/[taskId]/artifacts - Upload an artifact
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
    const { fileName, mimeType, content } = body;

    if (!fileName) {
      return ApiErrors.MISSING_REQUIRED_FIELD("fileName");
    }

    if (!mimeType) {
      return ApiErrors.MISSING_REQUIRED_FIELD("mimeType");
    }

    if (!content) {
      return ApiErrors.MISSING_REQUIRED_FIELD("content");
    }

    // Check content size (base64 encoded)
    const sizeBytes = Buffer.byteLength(content, "utf8");
    if (sizeBytes > MAX_ARTIFACT_SIZE) {
      return error(
        `Artifact too large. Maximum size is ${MAX_ARTIFACT_SIZE} bytes (1MB)`,
        413,
        "ARTIFACT_TOO_LARGE"
      );
    }

    const artifact = await db.taskArtifact.create({
      data: {
        taskId: params.taskId,
        botId: bot.id,
        fileName,
        mimeType,
        content,
        sizeBytes,
      },
    });

    await logBotAction({
      botId: bot.id,
      ownerId: bot.ownerId,
      action: "ARTIFACT_UPLOADED",
      resource: "artifact",
      resourceId: artifact.id,
      details: { taskId: params.taskId, fileName, sizeBytes },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
    });

    const headers = getRateLimitHeaders(bot.rateLimitPerMinute, rateLimit.remaining, rateLimit.resetAt);

    const response = success(formatArtifactForBot(artifact), 201);

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  });
}
