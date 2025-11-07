import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/adminMiddleware";
import { success, handleApiError } from "@/lib/apiResponse";
import { PROJECT_LIMITS, TASK_LIMITS } from "@/lib/projectLimits";

/**
 * POST /api/admin/upgrade-subscription - Admin only: Upgrade a user's subscription to unlimited
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAdminAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const body = await request.json();
    const { email, plan = "ENTERPRISE" } = body;

    if (!email) {
      return { success: false, error: { message: "Email is required", code: "MISSING_EMAIL" } };
    }

    // Find the user to upgrade
    const userToUpgrade = await db.user.findUnique({
      where: { email },
      include: { subscription: true },
    });

    if (!userToUpgrade) {
      return { success: false, error: { message: "User not found", code: "USER_NOT_FOUND" } };
    }

    // Get limits for the plan
    const planLimits = PROJECT_LIMITS[plan as keyof typeof PROJECT_LIMITS] || PROJECT_LIMITS.FREE;
    const taskLimits = TASK_LIMITS[plan as keyof typeof TASK_LIMITS] || TASK_LIMITS.FREE;

    // Update or create subscription
    const updatedSubscription = await db.subscription.upsert({
      where: { userId: userToUpgrade.id },
      create: {
        userId: userToUpgrade.id,
        plan: plan as any,
        projectLimit: planLimits.maxProjects === -1 ? 999999 : planLimits.maxProjects,
        taskLimit: taskLimits.maxTasks === -1 ? 999999 : taskLimits.maxTasks,
      },
      update: {
        plan: plan as any,
        projectLimit: planLimits.maxProjects === -1 ? 999999 : planLimits.maxProjects,
        taskLimit: taskLimits.maxTasks === -1 ? 999999 : taskLimits.maxTasks,
      },
    });

    return success({
      message: `User ${email} upgraded to ${plan} plan`,
      subscription: updatedSubscription,
    });
  });
}
