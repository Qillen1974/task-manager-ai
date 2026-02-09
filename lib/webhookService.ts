import crypto from "crypto";
import { db } from "@/lib/db";
import { formatTaskForBot } from "@/lib/botResponseFormatter";

const MAX_ATTEMPTS = parseInt(process.env.BOT_WEBHOOK_MAX_ATTEMPTS || "3", 10);

// Exponential backoff intervals in milliseconds: 1min, 5min, 15min
const RETRY_DELAYS = [60_000, 300_000, 900_000];

/**
 * Queue a webhook event for delivery
 */
export async function queueWebhookEvent({
  botId,
  event,
  payload,
}: {
  botId: string;
  event: string;
  payload: any;
}): Promise<void> {
  await db.webhookDelivery.create({
    data: {
      botId,
      event,
      payload,
      status: "pending",
    },
  });
}

/**
 * Deliver a single webhook
 * POSTs to the bot's webhookUrl with HMAC-SHA256 signature
 */
export async function deliverWebhook(deliveryId: string): Promise<boolean> {
  const delivery = await db.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: {
      bot: {
        select: {
          webhookUrl: true,
          webhookSecret: true,
          isActive: true,
        },
      },
    },
  });

  if (!delivery || !delivery.bot.webhookUrl || !delivery.bot.isActive) {
    if (delivery) {
      await db.webhookDelivery.update({
        where: { id: deliveryId },
        data: { status: "failed", lastAttemptAt: new Date() },
      });
    }
    return false;
  }

  const body = JSON.stringify({
    event: delivery.event,
    deliveryId: delivery.id,
    timestamp: new Date().toISOString(),
    data: delivery.payload,
  });

  // Create HMAC signature
  const signature = delivery.bot.webhookSecret
    ? `sha256=${crypto
        .createHmac("sha256", delivery.bot.webhookSecret)
        .update(body)
        .digest("hex")}`
    : "";

  const attempts = delivery.attempts + 1;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout

    const response = await fetch(delivery.bot.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": delivery.event,
        "X-Webhook-Delivery": delivery.id,
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseText = await response.text().catch(() => "");

    if (response.ok) {
      await db.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "delivered",
          httpStatus: response.status,
          response: responseText.substring(0, 1000),
          attempts,
          lastAttemptAt: new Date(),
          deliveredAt: new Date(),
          nextRetryAt: null,
        },
      });
      return true;
    }

    // Non-2xx response - schedule retry if under max attempts
    const nextRetryAt =
      attempts < MAX_ATTEMPTS
        ? new Date(Date.now() + (RETRY_DELAYS[attempts - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1]))
        : null;

    await db.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: attempts >= MAX_ATTEMPTS ? "failed" : "pending",
        httpStatus: response.status,
        response: responseText.substring(0, 1000),
        attempts,
        lastAttemptAt: new Date(),
        nextRetryAt,
      },
    });

    return false;
  } catch (err: any) {
    // Network error - schedule retry
    const nextRetryAt =
      attempts < MAX_ATTEMPTS
        ? new Date(Date.now() + (RETRY_DELAYS[attempts - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1]))
        : null;

    await db.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: attempts >= MAX_ATTEMPTS ? "failed" : "pending",
        response: (err.message || "Network error").substring(0, 1000),
        attempts,
        lastAttemptAt: new Date(),
        nextRetryAt,
      },
    });

    return false;
  }
}

/**
 * Process the webhook queue - find pending/retryable deliveries and deliver them
 */
export async function processWebhookQueue(): Promise<{
  processed: number;
  delivered: number;
  failed: number;
}> {
  const now = new Date();

  const pendingDeliveries = await db.webhookDelivery.findMany({
    where: {
      status: "pending",
      OR: [
        { nextRetryAt: null }, // Never attempted
        { nextRetryAt: { lte: now } }, // Retry time has passed
      ],
    },
    take: 50, // Process in batches
    orderBy: { createdAt: "asc" },
  });

  let delivered = 0;
  let failed = 0;

  for (const delivery of pendingDeliveries) {
    const ok = await deliverWebhook(delivery.id);
    if (ok) {
      delivered++;
    } else {
      failed++;
    }
  }

  return {
    processed: pendingDeliveries.length,
    delivered,
    failed,
  };
}

/**
 * Notify all bots scoped to a project about a task event
 */
export async function notifyBotsOfTaskEvent(
  projectId: string,
  event: string,
  taskData: any
): Promise<void> {
  if (process.env.BOT_WEBHOOKS_ENABLED !== "true") {
    return;
  }

  try {
    // Find all active bots that have a webhookUrl and are scoped to this project
    const bots = await db.bot.findMany({
      where: {
        isActive: true,
        webhookUrl: { not: null },
        OR: [
          { projectIds: { has: projectId } },
          // Also notify bots with empty projectIds if task belongs to their owner
          {
            projectIds: { isEmpty: true },
            owner: {
              projects: {
                some: { id: projectId },
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    const formattedTask = formatTaskForBot(taskData);

    for (const bot of bots) {
      await queueWebhookEvent({
        botId: bot.id,
        event,
        payload: formattedTask,
      });
    }
  } catch (err) {
    console.error("[Webhook] Error notifying bots:", err);
  }
}
