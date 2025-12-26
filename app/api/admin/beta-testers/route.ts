import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminToken } from "@/lib/adminAuth";

/**
 * GET /api/admin/beta-testers
 * Get all beta testers with their activity stats
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const admin = verifyAdminToken(token);
    if (!admin) {
      return NextResponse.json({ success: false, error: { message: "Invalid admin token" } }, { status: 401 });
    }

    // Get all beta testers - use raw query to avoid Prisma client schema issues
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

    return NextResponse.json({
      success: true,
      data: {
        betaTesters: betaTestersWithStats,
        summary: {
          total: totalBetaTesters,
          unlocked: unlockedCount,
          pendingUnlock: pendingUnlockCount,
        },
      },
    });
  } catch (err) {
    console.error("[Beta Testers API] Error:", err);
    return NextResponse.json(
      { success: false, error: { message: `Failed: ${err instanceof Error ? err.message : String(err)}` } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/beta-testers
 * Grant or revoke mobile unlock for selected users
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const admin = verifyAdminToken(token);
    if (!admin) {
      return NextResponse.json({ success: false, error: { message: "Invalid admin token" } }, { status: 401 });
    }

    const body = await request.json();
    const { userIds, action } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ success: false, error: { message: "userIds must be a non-empty array" } }, { status: 400 });
    }

    if (action !== "grant" && action !== "revoke") {
      return NextResponse.json({ success: false, error: { message: "action must be 'grant' or 'revoke'" } }, { status: 400 });
    }

    // Use raw query to update
    const mobileUnlocked = action === "grant";
    const result = await db.$executeRaw`
      UPDATE "User"
      SET "mobileUnlocked" = ${mobileUnlocked}
      WHERE id = ANY(${userIds}::text[]) AND "isBetaTester" = true
    `;

    return NextResponse.json({
      success: true,
      data: {
        message: `Successfully ${action === "grant" ? "granted" : "revoked"} mobile unlock for ${result} user(s)`,
        updatedCount: result,
      },
    });
  } catch (err) {
    console.error("[Beta Testers API] POST Error:", err);
    return NextResponse.json(
      { success: false, error: { message: `Failed: ${err instanceof Error ? err.message : String(err)}` } },
      { status: 500 }
    );
  }
}
