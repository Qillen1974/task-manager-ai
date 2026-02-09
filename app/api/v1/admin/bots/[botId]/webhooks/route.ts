import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/adminMiddleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";

/**
 * GET /api/v1/admin/bots/[botId]/webhooks - List recent webhook deliveries
 */
export async function GET(
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
      select: { id: true, name: true, webhookUrl: true },
    });

    if (!bot) {
      return ApiErrors.NOT_FOUND("Bot");
    }

    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const limit = Math.min(Math.max(parseInt(limitParam || "50", 10) || 50, 1), 100);
    const status = url.searchParams.get("status"); // pending, delivered, failed

    const where: any = { botId: params.botId };
    if (status) {
      where.status = status;
    }

    const deliveries = await db.webhookDelivery.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        event: true,
        status: true,
        httpStatus: true,
        response: true,
        attempts: true,
        lastAttemptAt: true,
        deliveredAt: true,
        nextRetryAt: true,
        createdAt: true,
      },
    });

    return success({
      bot: { id: bot.id, name: bot.name, webhookUrl: bot.webhookUrl },
      deliveries,
    });
  });
}
