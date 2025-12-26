import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/adminMiddleware";
import { success, handleApiError } from "@/lib/apiResponse";

/**
 * GET /api/admin/beta-testers
 * Get all beta testers with their activity stats
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAdminAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    // Get all beta testers using raw SQL
    const betaTesters = await db.$queryRaw<Array<{
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      isBetaTester: boolean;
      betaJoinedAt: Date | null;
      mobileUnlocked: boolean;
      createdAt: Date;
      lastLoginAt: Date | null;
    }>>`
      SELECT id, email, "firstName", "lastName", "isBetaTester", "betaJoinedAt", "mobileUnlocked", "createdAt", "lastLoginAt"
      FROM "User"
      WHERE "isBetaTester" = true
      ORDER BY "betaJoinedAt" DESC NULLS LAST
    `;

    // Get counts for each user
    const betaTestersWithStats = await Promise.all(
      betaTesters.map(async (user) => {
        const [projectCount, totalTaskCount, completedTaskCount, recurringTaskCount] = await Promise.all([
          db.project.count({ where: { userId: user.id } }),
          db.task.count({ where: { userId: user.id } }),
          db.task.count({ where: { userId: user.id, completed: true } }),
          db.task.count({ where: { userId: user.id, isRecurring: true, parentTaskId: null } }),
        ]);

        return {
          ...user,
          name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
          projectCount,
          totalTaskCount,
          completedTaskCount,
          recurringTaskCount,
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
  });
}

/**
 * POST /api/admin/beta-testers
 * Grant or revoke mobile unlock for selected users
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAdminAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const body = await request.json();
    const { userIds, action } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return { success: false, error: { message: "userIds must be a non-empty array" } };
    }

    if (action !== "grant" && action !== "revoke") {
      return { success: false, error: { message: "action must be 'grant' or 'revoke'" } };
    }

    // Use raw query to update
    const mobileUnlocked = action === "grant";
    const result = await db.$executeRaw`
      UPDATE "User"
      SET "mobileUnlocked" = ${mobileUnlocked}
      WHERE id = ANY(${userIds}::text[]) AND "isBetaTester" = true
    `;

    return success({
      message: `Successfully ${action === "grant" ? "granted" : "revoked"} mobile unlock for ${result} user(s)`,
      updatedCount: result,
    });
  });
}
