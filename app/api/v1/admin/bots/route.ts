import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/adminMiddleware";
import { success, error, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { generateBotApiKey, generateWebhookSecret } from "@/lib/botApiKey";
import { logBotAction } from "@/lib/botAuditLog";

/**
 * POST /api/v1/admin/bots - Register a new bot
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAdminAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const body = await request.json();
    const {
      name,
      ownerId,
      description,
      projectIds,
      webhookUrl,
      permissions,
      rateLimitPerMinute,
    } = body;

    if (!name || !name.trim()) {
      return ApiErrors.MISSING_REQUIRED_FIELD("name");
    }

    if (!ownerId) {
      return ApiErrors.MISSING_REQUIRED_FIELD("ownerId");
    }

    // Verify owner exists
    const owner = await db.user.findUnique({
      where: { id: ownerId },
      select: { id: true, email: true },
    });

    if (!owner) {
      return ApiErrors.NOT_FOUND("Owner user");
    }

    // Validate projectIds if provided
    if (projectIds && projectIds.length > 0) {
      const projects = await db.project.findMany({
        where: { id: { in: projectIds }, userId: ownerId },
        select: { id: true },
      });

      if (projects.length !== projectIds.length) {
        return error(
          "One or more project IDs are invalid or not owned by the specified user",
          400,
          "INVALID_PROJECT_IDS"
        );
      }
    }

    // Generate API key and webhook secret
    const { rawKey, hash, prefix } = generateBotApiKey();
    const webhookSecret = webhookUrl ? generateWebhookSecret() : null;

    const bot = await db.bot.create({
      data: {
        name: name.trim(),
        ownerId,
        description: description?.trim() || null,
        apiKeyHash: hash,
        apiKeyPrefix: prefix,
        projectIds: projectIds || [],
        permissions:
          permissions || "tasks:read,tasks:write,comments:read,comments:write",
        webhookUrl: webhookUrl || null,
        webhookSecret,
        rateLimitPerMinute: rateLimitPerMinute || 60,
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
        createdAt: true,
      },
    });

    await logBotAction({
      botId: bot.id,
      ownerId,
      action: "CREATED",
      resource: "bot",
      resourceId: bot.id,
      details: { name: bot.name },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
    });

    return success(
      {
        ...bot,
        apiKey: rawKey, // Only shown once
        webhookSecret: webhookSecret, // Only shown once
      },
      201
    );
  });
}

/**
 * GET /api/v1/admin/bots - List all bots
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAdminAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const bots = await db.bot.findMany({
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
      orderBy: { createdAt: "desc" },
    });

    return success(bots);
  });
}
