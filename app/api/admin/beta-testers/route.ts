import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error, handleApiError } from "@/lib/apiResponse";
import { verifyAdminToken } from "@/lib/adminAuth";

/**
 * GET /api/admin/beta-testers
 * Get all beta testers with their activity stats
 */
export async function GET(request: NextRequest) {
  console.log("[Beta Testers API] GET request received");
  try {
    // Verify admin token
    const authHeader = request.headers.get("authorization");
    console.log("[Beta Testers API] Auth header:", authHeader ? "present" : "missing");
    if (!authHeader?.startsWith("Bearer ")) {
      return error("Unauthorized", 401);
    }

    const token = authHeader.substring(7);
    const admin = verifyAdminToken(token);
    if (!admin) {
      return error("Invalid admin token", 401);
    }

    // Get all beta testers with their activity stats
    console.log("[Beta Testers API] Querying database...");
    const betaTesters = await db.user.findMany({
      where: {
        isBetaTester: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isBetaTester: true,
        betaJoinedAt: true,
        mobileUnlocked: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            projects: true,
            tasks: true,
          },
        },
      },
      orderBy: {
        betaJoinedAt: "desc",
      },
    });
    console.log("[Beta Testers API] Found", betaTesters.length, "beta testers");

    // Get additional stats for each user
    const betaTestersWithStats = await Promise.all(
      betaTesters.map(async (user) => {
        // Count completed tasks
        const completedTaskCount = await db.task.count({
          where: {
            userId: user.id,
            completed: true,
          },
        });

        // Count recurring tasks
        const recurringTaskCount = await db.task.count({
          where: {
            userId: user.id,
            isRecurring: true,
            parentTaskId: null,
          },
        });

        return {
          ...user,
          name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
          completedTaskCount,
          recurringTaskCount,
          totalTaskCount: user._count.tasks,
          projectCount: user._count.projects,
        };
      })
    );

    // Get summary stats
    const totalBetaTesters = betaTesters.length;
    const unlockedCount = betaTesters.filter((u) => u.mobileUnlocked).length;
    const pendingUnlockCount = totalBetaTesters - unlockedCount;

    return success({
      betaTesters: betaTestersWithStats,
      summary: {
        total: totalBetaTesters,
        unlocked: unlockedCount,
        pendingUnlock: pendingUnlockCount,
      },
    });
  } catch (err) {
    console.error("[Beta Testers API] Error:", err);
    return error(`Failed to fetch beta testers: ${err instanceof Error ? err.message : String(err)}`, 500);
  }
}

/**
 * POST /api/admin/beta-testers
 * Grant or revoke mobile unlock for selected users
 *
 * Body: { userIds: string[], action: "grant" | "revoke" }
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    // Verify admin token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return error("Unauthorized", 401);
    }

    const token = authHeader.substring(7);
    const admin = verifyAdminToken(token);
    if (!admin) {
      return error("Invalid admin token", 401);
    }

    const body = await request.json();
    const { userIds, action } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return error("userIds must be a non-empty array", 400);
    }

    if (action !== "grant" && action !== "revoke") {
      return error("action must be 'grant' or 'revoke'", 400);
    }

    // Update mobile unlock status for selected users
    const result = await db.user.updateMany({
      where: {
        id: { in: userIds },
        isBetaTester: true, // Only allow updating beta testers
      },
      data: {
        mobileUnlocked: action === "grant",
      },
    });

    return success({
      message: `Successfully ${action === "grant" ? "granted" : "revoked"} mobile unlock for ${result.count} user(s)`,
      updatedCount: result.count,
    });
  });
}
