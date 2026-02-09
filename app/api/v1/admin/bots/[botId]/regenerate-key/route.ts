import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/adminMiddleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { generateBotApiKey } from "@/lib/botApiKey";
import { logBotAction } from "@/lib/botAuditLog";

/**
 * POST /api/v1/admin/bots/[botId]/regenerate-key - Generate a new API key
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyAdminAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const bot = await db.bot.findUnique({
      where: { id: params.botId },
    });

    if (!bot) {
      return ApiErrors.NOT_FOUND("Bot");
    }

    const { rawKey, hash, prefix } = generateBotApiKey();

    await db.bot.update({
      where: { id: params.botId },
      data: {
        apiKeyHash: hash,
        apiKeyPrefix: prefix,
      },
    });

    await logBotAction({
      botId: bot.id,
      ownerId: bot.ownerId,
      action: "KEY_REGENERATED",
      resource: "bot",
      resourceId: bot.id,
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
    });

    return success({
      apiKey: rawKey, // Only shown once
      apiKeyPrefix: prefix,
      message: "API key regenerated. Previous key is now invalid.",
    });
  });
}
