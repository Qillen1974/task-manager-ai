import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, handleApiError } from "@/lib/apiResponse";

/**
 * GET /api/auth/me - Get current user profile
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const user = await db.user.findUnique({
      where: { id: auth.userId },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      return { error: "User not found", status: 404 };
    }

    // Get user stats
    const projectCount = await db.project.count({
      where: { userId: user.id },
    });

    const taskCount = await db.task.count({
      where: { userId: user.id },
    });

    const completedTaskCount = await db.task.count({
      where: {
        userId: user.id,
        completed: true,
      },
    });

    return success({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      subscription: {
        plan: user.subscription?.plan,
        status: user.subscription?.status,
        projectLimit: user.subscription?.projectLimit,
        taskLimit: user.subscription?.taskLimit,
      },
      stats: {
        projects: projectCount,
        tasks: taskCount,
        completedTasks: completedTaskCount,
        completionRate:
          taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0,
      },
    });
  });
}

/**
 * PATCH /api/auth/me - Update user profile
 */
export async function PATCH(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const body = await request.json();
    const { name } = body;

    const updated = await db.user.update({
      where: { id: auth.userId },
      data: {
        ...(name !== undefined && { name }),
      },
      include: {
        subscription: true,
      },
    });

    return success({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
      },
      subscription: {
        plan: updated.subscription?.plan,
        projectLimit: updated.subscription?.projectLimit,
        taskLimit: updated.subscription?.taskLimit,
      },
    });
  });
}
