import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { success, error, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { verifyBotAuth, botHasPermission, botCanAccessProject } from "@/lib/botMiddleware";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/botRateLimit";
import { logBotAction } from "@/lib/botAuditLog";

/**
 * GET /api/v1/bot/tasks/[taskId]/artifacts/[artifactId] - Download/view artifact
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string; artifactId: string } }
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

    const artifact = await db.taskArtifact.findUnique({
      where: { id: params.artifactId },
      include: {
        task: {
          select: { id: true, projectId: true },
        },
      },
    });

    if (!artifact || artifact.taskId !== params.taskId) {
      return ApiErrors.NOT_FOUND("Artifact");
    }

    const canAccess = await botCanAccessProject(bot, artifact.task.projectId);
    if (!canAccess) {
      return error("Bot cannot access this project", 403, "BOT_PROJECT_ACCESS_DENIED");
    }

    const headers = getRateLimitHeaders(bot.rateLimitPerMinute, rateLimit.remaining, rateLimit.resetAt);

    const response = success({
      id: artifact.id,
      taskId: artifact.taskId,
      botId: artifact.botId,
      fileName: artifact.fileName,
      mimeType: artifact.mimeType,
      sizeBytes: artifact.sizeBytes,
      content: artifact.content,
      createdAt: artifact.createdAt.toISOString(),
    });

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  });
}

/**
 * DELETE /api/v1/bot/tasks/[taskId]/artifacts/[artifactId] - Remove artifact
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string; artifactId: string } }
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

    const artifact = await db.taskArtifact.findUnique({
      where: { id: params.artifactId },
    });

    if (!artifact || artifact.taskId !== params.taskId) {
      return ApiErrors.NOT_FOUND("Artifact");
    }

    // Only the bot that uploaded the artifact can delete it
    if (artifact.botId !== bot.id) {
      return error("Bot can only delete its own artifacts", 403, "BOT_PERMISSION_DENIED");
    }

    await db.taskArtifact.delete({
      where: { id: params.artifactId },
    });

    await logBotAction({
      botId: bot.id,
      ownerId: bot.ownerId,
      action: "ARTIFACT_DELETED",
      resource: "artifact",
      resourceId: artifact.id,
      details: { taskId: params.taskId, fileName: artifact.fileName },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
    });

    const headers = getRateLimitHeaders(bot.rateLimitPerMinute, rateLimit.remaining, rateLimit.resetAt);

    const response = success({ message: "Artifact deleted" });

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  });
}
