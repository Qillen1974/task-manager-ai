import { db } from "@/lib/db";

/**
 * Log a bot action to the audit log
 * Uses the bot owner's userId and includes botId in the details JSON
 */
export async function logBotAction({
  botId,
  ownerId,
  action,
  resource,
  resourceId,
  details,
  ipAddress,
}: {
  botId: string;
  ownerId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: ownerId,
        action: `BOT_${action}`,
        resource,
        details: JSON.stringify({
          botId,
          resourceId,
          ...details,
        }),
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error("[BotAudit] Failed to log action:", error);
  }
}
