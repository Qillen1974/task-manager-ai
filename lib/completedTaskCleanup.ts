import { db } from "@/lib/db";

/**
 * Completed Task Cleanup Service
 * Automatically removes completed tasks that exceed the user's retention period
 *
 * Rules:
 * - Only deletes tasks where completed = true
 * - Only deletes tasks where completedAt is older than retention period
 * - NEVER deletes recurring task templates (isRecurring = true)
 * - Respects user's retention settings
 * - FREE users: max 90 days retention
 * - PRO/ENTERPRISE users: max 365 days retention
 */

export interface CleanupResult {
  success: boolean;
  tasksDeleted: number;
  usersProcessed: number;
  errors: Array<{ userId: string; error: string }>;
  message: string;
}

// Plan-based maximum retention limits (in days)
const RETENTION_LIMITS = {
  FREE: 90,
  PRO: 365,
  ENTERPRISE: 365,
} as const;

/**
 * Get the effective retention days for a user based on their plan and settings
 */
function getEffectiveRetentionDays(
  userRetentionDays: number | null,
  plan: string
): number {
  const maxRetention = RETENTION_LIMITS[plan as keyof typeof RETENTION_LIMITS] || RETENTION_LIMITS.FREE;
  const userSetting = userRetentionDays ?? 30; // Default to 30 days if not set

  // User cannot exceed their plan's maximum retention
  return Math.min(userSetting, maxRetention);
}

/**
 * Clean up completed tasks for all users based on their retention settings
 * Should be called by a scheduled job (e.g., daily at 2 AM UTC)
 */
export async function cleanupCompletedTasks(): Promise<CleanupResult> {
  const errors: Array<{ userId: string; error: string }> = [];
  let totalTasksDeleted = 0;
  let usersProcessed = 0;

  try {
    // Get all users with their settings and subscription plan
    const users = await db.user.findMany({
      include: {
        settings: true,
        subscription: true,
      },
    });

    console.log(`[Task Cleanup] Processing ${users.length} users`);

    for (const user of users) {
      try {
        const plan = user.subscription?.plan || "FREE";
        const userRetentionDays = user.settings?.completedTaskRetentionDays ?? 30;
        const effectiveRetention = getEffectiveRetentionDays(userRetentionDays, plan);

        // Calculate the cutoff date
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - effectiveRetention);

        // Delete completed tasks that:
        // 1. Are completed
        // 2. Were completed before the cutoff date
        // 3. Are NOT recurring task templates (isRecurring = false)
        const result = await db.task.deleteMany({
          where: {
            userId: user.id,
            completed: true,
            completedAt: {
              lt: cutoffDate,
            },
            // Never delete recurring task templates
            isRecurring: false,
          },
        });

        if (result.count > 0) {
          console.log(
            `[Task Cleanup] Deleted ${result.count} tasks for user ${user.id} (plan: ${plan}, retention: ${effectiveRetention} days)`
          );
          totalTasksDeleted += result.count;
        }

        usersProcessed++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`[Task Cleanup] Error processing user ${user.id}:`, errorMessage);
        errors.push({
          userId: user.id,
          error: errorMessage,
        });
      }
    }

    const message = `Cleanup complete. Deleted ${totalTasksDeleted} task${totalTasksDeleted !== 1 ? "s" : ""} from ${usersProcessed} user${usersProcessed !== 1 ? "s" : ""}.${
      errors.length > 0 ? ` ${errors.length} error${errors.length !== 1 ? "s" : ""} occurred.` : ""
    }`;

    console.log(`[Task Cleanup] ${message}`);

    return {
      success: errors.length === 0,
      tasksDeleted: totalTasksDeleted,
      usersProcessed,
      errors,
      message,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Task Cleanup] Service error:", errorMessage);

    return {
      success: false,
      tasksDeleted: 0,
      usersProcessed: 0,
      errors: [{ userId: "system", error: errorMessage }],
      message: `Cleanup service failed: ${errorMessage}`,
    };
  }
}

/**
 * Preview what would be deleted for a specific user (for UI display)
 * Does not actually delete anything
 */
export async function previewCleanupForUser(userId: string): Promise<{
  tasksToDelete: number;
  oldestTask: Date | null;
  retentionDays: number;
  planLimit: number;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      settings: true,
      subscription: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const plan = user.subscription?.plan || "FREE";
  const userRetentionDays = user.settings?.completedTaskRetentionDays ?? 30;
  const effectiveRetention = getEffectiveRetentionDays(userRetentionDays, plan);
  const planLimit = RETENTION_LIMITS[plan as keyof typeof RETENTION_LIMITS] || RETENTION_LIMITS.FREE;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - effectiveRetention);

  const tasksToDelete = await db.task.count({
    where: {
      userId: user.id,
      completed: true,
      completedAt: {
        lt: cutoffDate,
      },
      isRecurring: false,
    },
  });

  const oldestTask = await db.task.findFirst({
    where: {
      userId: user.id,
      completed: true,
      isRecurring: false,
    },
    orderBy: {
      completedAt: "asc",
    },
    select: {
      completedAt: true,
    },
  });

  return {
    tasksToDelete,
    oldestTask: oldestTask?.completedAt || null,
    retentionDays: effectiveRetention,
    planLimit,
  };
}
