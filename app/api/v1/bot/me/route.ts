import { NextRequest } from "next/server";
import { success, handleApiError } from "@/lib/apiResponse";
import { verifyBotAuth } from "@/lib/botMiddleware";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/botRateLimit";
import { NextResponse } from "next/server";

/**
 * GET /api/v1/bot/me - Bot self-info
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyBotAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const bot = auth.bot!;

    const rateLimit = checkRateLimit(bot.id, bot.rateLimitPerMinute);
    if (!rateLimit.allowed) {
      const headers = getRateLimitHeaders(
        bot.rateLimitPerMinute,
        rateLimit.remaining,
        rateLimit.resetAt
      );
      return NextResponse.json(
        {
          success: false,
          error: { message: "Rate limit exceeded", code: "BOT_RATE_LIMITED" },
        },
        { status: 429, headers }
      );
    }

    const headers = getRateLimitHeaders(
      bot.rateLimitPerMinute,
      rateLimit.remaining,
      rateLimit.resetAt
    );

    const response = success({
      id: bot.id,
      name: bot.name,
      description: bot.description,
      permissions: bot.permissions.split(",").map((p: string) => p.trim()),
      projectIds: bot.projectIds,
      rateLimitPerMinute: bot.rateLimitPerMinute,
      webhookUrl: bot.webhookUrl,
      owner: {
        id: bot.owner.id,
        email: bot.owner.email,
      },
      lastUsedAt: bot.lastUsedAt,
      createdAt: bot.createdAt,
    });

    // Add rate limit headers
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  });
}
