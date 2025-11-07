import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/adminMiddleware";
import { success, handleApiError } from "@/lib/apiResponse";
import { getCorrectLimitsForPlan } from "@/lib/projectLimits";

/**
 * GET /api/admin/users - Admin only: List all users with their subscriptions
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAdminAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    // Use raw SQL to get users with isAdmin field and counts
    const users = await db.$queryRaw`
      SELECT
        u.id,
        u.email,
        u.name,
        u."isAdmin",
        u."createdAt",
        u."lastLoginAt",
        s.id as "subscription_id",
        s.plan,
        s."projectLimit",
        s."taskLimit",
        COUNT(DISTINCT p.id) as "projectCount",
        COUNT(DISTINCT t.id) as "taskCount"
      FROM "User" u
      LEFT JOIN "Subscription" s ON u.id = s."userId"
      LEFT JOIN "Project" p ON u.id = p."userId"
      LEFT JOIN "Task" t ON u.id = t."userId"
      GROUP BY u.id, s.id
      ORDER BY u."createdAt" DESC
    `;

    // Transform the raw results into the expected format
    const userList = (users as any[]).map((row) => {
      let subscription = null;
      if (row.subscription_id) {
        // Use correct limits for the plan (corrects any outdated/hardcoded values)
        const correctLimits = getCorrectLimitsForPlan(row.plan);
        subscription = {
          id: row.subscription_id,
          plan: row.plan,
          projectLimit: correctLimits.projectLimit,
          taskLimit: correctLimits.taskLimit,
        };
      }

      return {
        id: row.id,
        email: row.email,
        name: row.name,
        isAdmin: row.isAdmin || false,
        createdAt: row.createdAt,
        lastLoginAt: row.lastLoginAt,
        _count: {
          projects: Number(row.projectCount) || 0,
          tasks: Number(row.taskCount) || 0,
        },
        subscription,
      };
    });

    return success(userList);
  });
}

/**
 * PATCH /api/admin/users/:id - Admin only: Update user (set admin status or subscription)
 */
export async function PATCH(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAdminAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return { success: false, error: { message: "User ID is required", code: "MISSING_ID" } };
    }

    const body = await request.json();
    const { isAdmin } = body;

    if (typeof isAdmin !== "boolean") {
      return { success: false, error: { message: "isAdmin must be a boolean", code: "INVALID_ADMIN" } };
    }

    // Update using raw SQL
    await db.$executeRaw`UPDATE "User" SET "isAdmin" = ${isAdmin} WHERE id = ${userId}`;

    // Get the updated user
    const result = await db.$queryRaw`
      SELECT
        u.id,
        u.email,
        u.name,
        u."isAdmin",
        s.id as "subscription_id",
        s.plan,
        s."projectLimit",
        s."taskLimit"
      FROM "User" u
      LEFT JOIN "Subscription" s ON u.id = s."userId"
      WHERE u.id = ${userId}
      LIMIT 1
    `;

    const rows = result as any[];
    if (rows.length === 0) {
      return { success: false, error: { message: "User not found", code: "NOT_FOUND" } };
    }

    const row = rows[0];
    let subscription = null;
    if (row.subscription_id) {
      // Use correct limits for the plan (corrects any outdated/hardcoded values)
      const correctLimits = getCorrectLimitsForPlan(row.plan);
      subscription = {
        id: row.subscription_id,
        plan: row.plan,
        projectLimit: correctLimits.projectLimit,
        taskLimit: correctLimits.taskLimit,
      };
    }

    return success({
      message: `User ${row.email} admin status updated`,
      user: {
        id: row.id,
        email: row.email,
        name: row.name,
        isAdmin: row.isAdmin || false,
        subscription,
      },
    });
  });
}

/**
 * DELETE /api/admin/users/:id - Admin only: Delete a user and all their data
 */
export async function DELETE(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAdminAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return { success: false, error: { message: "User ID is required", code: "MISSING_ID" } };
    }

    // Find the user first to get their email
    const userResult = await db.$queryRaw<Array<{ id: string; email: string }>>`
      SELECT id, email FROM "User" WHERE id = ${userId}
    `;

    if (userResult.length === 0) {
      return { success: false, error: { message: "User not found", code: "NOT_FOUND" } };
    }

    const userEmail = userResult[0].email;

    // Delete all user data in order: Tasks, Projects, Sessions, Subscriptions, User
    await db.$executeRaw`DELETE FROM "Task" WHERE "userId" = ${userId}`;
    await db.$executeRaw`DELETE FROM "Project" WHERE "userId" = ${userId}`;
    await db.$executeRaw`DELETE FROM "Session" WHERE "userId" = ${userId}`;
    await db.$executeRaw`DELETE FROM "Subscription" WHERE "userId" = ${userId}`;
    await db.$executeRaw`DELETE FROM "User" WHERE id = ${userId}`;

    return success({
      message: `User ${userEmail} and all their data have been deleted`,
      userId,
    });
  });
}
