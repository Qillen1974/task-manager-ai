import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashApiKey, isValidKeyFormat } from "@/lib/botApiKey";
import { ApiErrors } from "@/lib/apiResponse";

interface BotAuthResult {
  authenticated: boolean;
  bot?: any;
  error?: ReturnType<typeof ApiErrors.UNAUTHORIZED>;
}

/**
 * Verify bot authentication via Bearer token
 * Extracts API key from Authorization header, hashes it, and looks up the bot
 */
export async function verifyBotAuth(request: NextRequest): Promise<BotAuthResult> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      authenticated: false,
      error: ApiErrors.MISSING_TOKEN(),
    };
  }

  const rawKey = authHeader.replace("Bearer ", "");

  if (!isValidKeyFormat(rawKey)) {
    return {
      authenticated: false,
      error: ApiErrors.INVALID_TOKEN(),
    };
  }

  const keyHash = hashApiKey(rawKey);

  const bot = await db.bot.findUnique({
    where: { apiKeyHash: keyHash },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          subscription: {
            select: { plan: true },
          },
        },
      },
    },
  });

  if (!bot) {
    return {
      authenticated: false,
      error: ApiErrors.INVALID_TOKEN(),
    };
  }

  if (!bot.isActive) {
    return {
      authenticated: false,
      error: ApiErrors.UNAUTHORIZED(),
    };
  }

  // Update lastUsedAt (fire-and-forget)
  db.bot.update({
    where: { id: bot.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return {
    authenticated: true,
    bot,
  };
}

/**
 * Check if bot has a specific permission
 * Permissions are stored as comma-separated string e.g. "tasks:read,tasks:write"
 */
export function botHasPermission(bot: { permissions: string }, permission: string): boolean {
  const perms = bot.permissions.split(",").map((p) => p.trim());
  return perms.includes(permission) || perms.includes("*");
}

/**
 * Check if bot can access a specific project
 * Bot can access projects in its projectIds array, or falls back to owner's projects
 */
export async function botCanAccessProject(
  bot: { id: string; ownerId: string; projectIds: string[] },
  projectId: string
): Promise<boolean> {
  // If bot has explicit project IDs, check against those
  if (bot.projectIds.length > 0) {
    return bot.projectIds.includes(projectId);
  }

  // Fall back to checking if project belongs to the bot's owner
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      userId: bot.ownerId,
    },
  });

  return !!project;
}
