import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/adminMiddleware";
import { success, handleApiError } from "@/lib/apiResponse";

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

    // Update or create subscription
    const updatedSubscription = await db.subscription.upsert({
      where: { userId: userToUpgrade.id },
      create: {
        userId: userToUpgrade.id,
        plan: plan as any,
        projectLimit: plan === "ENTERPRISE" ? 999999 : plan === "PRO" ? 100 : 3,
        taskLimit: plan === "ENTERPRISE" ? 999999 : plan === "PRO" ? 500 : 50,
      },
      update: {
        plan: plan as any,
        projectLimit: plan === "ENTERPRISE" ? 999999 : plan === "PRO" ? 100 : 3,
        taskLimit: plan === "ENTERPRISE" ? 999999 : plan === "PRO" ? 500 : 50,
      },
    });

    return success({
      message: `User ${email} upgraded to ${plan} plan`,
      subscription: updatedSubscription,
    });
  });
}
