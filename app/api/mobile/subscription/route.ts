import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromHeader, verifyToken } from "@/lib/authUtils";
import { success, error, handleApiError } from "@/lib/apiResponse";

// Mark as dynamic since it uses request.headers
export const dynamic = "force-dynamic";

// Mobile-specific limits based on pricing strategy
const MOBILE_LIMITS = {
  FREE: {
    maxProjects: 3,
    maxTasks: 15,
    maxRecurringTasks: 0,
    aiButlerQueriesPerDay: 5,
  },
  UNLOCKED: {
    maxProjects: -1, // Unlimited
    maxTasks: -1, // Unlimited
    maxRecurringTasks: -1, // Unlimited
    aiButlerQueriesPerDay: 20,
  },
};

/**
 * Check if mobile beta mode is enabled
 * During beta, all users get unlimited access
 */
function isBetaModeEnabled(): boolean {
  return process.env.MOBILE_BETA_MODE === "true";
}

/**
 * GET /api/mobile/subscription
 * Get current user's mobile subscription/unlock status and limits
 *
 * Returns mobile-specific limits based on:
 * 1. Beta mode (all limits bypassed during beta)
 * 2. User's mobileUnlocked status (one-time $4.99 purchase)
 * 3. User's isBetaTester status (free unlock for beta participants)
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    // Verify user is authenticated
    const authHeader = request.headers.get("authorization");
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      return error("Unauthorized", 401);
    }

    const decoded = verifyToken(token, "access");
    if (!decoded) {
      return error("Invalid token", 401);
    }

    const userId = decoded.userId;

    // Get user with mobile unlock status
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isBetaTester: true,
        betaJoinedAt: true,
        mobileUnlocked: true,
      },
    });

    if (!user) {
      return error("User not found", 404);
    }

    // Check beta mode first - during beta, everyone gets unlimited
    const betaMode = isBetaModeEnabled();

    // Determine if user has premium mobile access
    const hasPremiumAccess = betaMode || user.mobileUnlocked || user.isBetaTester;

    // Get appropriate limits
    const limits = hasPremiumAccess ? MOBILE_LIMITS.UNLOCKED : MOBILE_LIMITS.FREE;

    // Get current counts for limit checking
    const [projectCount, taskCount, recurringTaskCount] = await Promise.all([
      db.project.count({ where: { userId } }),
      db.task.count({ where: { userId, completed: false } }),
      db.task.count({ where: { userId, isRecurring: true, parentTaskId: null } }),
    ]);

    return success({
      // User status
      isBetaTester: user.isBetaTester,
      betaJoinedAt: user.betaJoinedAt,
      mobileUnlocked: user.mobileUnlocked,

      // Beta mode status
      betaModeActive: betaMode,

      // Computed access level
      hasPremiumAccess,
      accessReason: betaMode
        ? "beta_mode"
        : user.mobileUnlocked
          ? "purchased"
          : user.isBetaTester
            ? "beta_reward"
            : "free",

      // Limits
      limits: {
        maxProjects: limits.maxProjects,
        maxTasks: limits.maxTasks,
        maxRecurringTasks: limits.maxRecurringTasks,
        aiButlerQueriesPerDay: limits.aiButlerQueriesPerDay,
      },

      // Current usage
      usage: {
        projectCount,
        activeTaskCount: taskCount,
        recurringTaskCount,
      },

      // Computed limit status
      canCreateProject: limits.maxProjects === -1 || projectCount < limits.maxProjects,
      canCreateTask: limits.maxTasks === -1 || taskCount < limits.maxTasks,
      canCreateRecurringTask: limits.maxRecurringTasks === -1 ||
        (limits.maxRecurringTasks > 0 && recurringTaskCount < limits.maxRecurringTasks),
    });
  });
}

/**
 * POST /api/mobile/subscription
 * Mark user as beta tester (called on first mobile app login during beta)
 *
 * This endpoint is called automatically when a user logs in via the mobile app
 * during the beta testing period to track beta participants.
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    // Verify user is authenticated
    const authHeader = request.headers.get("authorization");
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      return error("Unauthorized", 401);
    }

    const decoded = verifyToken(token, "access");
    if (!decoded) {
      return error("Invalid token", 401);
    }

    const userId = decoded.userId;

    // Only mark as beta tester if beta mode is active
    if (!isBetaModeEnabled()) {
      return error("Beta mode is not active", 400);
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { isBetaTester: true, betaJoinedAt: true },
    });

    if (!user) {
      return error("User not found", 404);
    }

    // If already a beta tester, just return current status
    if (user.isBetaTester) {
      return success({
        message: "User is already a beta tester",
        isBetaTester: true,
        betaJoinedAt: user.betaJoinedAt,
      });
    }

    // Mark user as beta tester
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        isBetaTester: true,
        betaJoinedAt: new Date(),
      },
      select: {
        isBetaTester: true,
        betaJoinedAt: true,
      },
    });

    return success({
      message: "User marked as beta tester",
      isBetaTester: updatedUser.isBetaTester,
      betaJoinedAt: updatedUser.betaJoinedAt,
    });
  });
}
