import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromHeader } from "@/lib/authUtils";
import { verifyToken } from "@/lib/authUtils";
import { success, handleApiError } from "@/lib/apiResponse";

// Mark as dynamic since it uses request.headers
export const dynamic = "force-dynamic";

/**
 * GET /api/subscriptions/current
 * Get current user's subscription details
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    // Verify user is authenticated
    const authHeader = request.headers.get("authorization");
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      return {
        success: false,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      };
    }

    const decoded = verifyToken(token, "access");
    if (!decoded) {
      return {
        success: false,
        error: { message: "Invalid token", code: "INVALID_TOKEN" },
      };
    }

    const userId = decoded.userId;

    // Get or create default subscription
    let subscription = await db.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      // Create default FREE subscription if it doesn't exist
      subscription = await db.subscription.create({
        data: {
          userId,
          plan: "FREE",
          projectLimit: 3,
          taskLimit: 50,
          status: "ACTIVE",
        },
      });
    }

    return success({
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      projectLimit: subscription.projectLimit,
      taskLimit: subscription.taskLimit,
      paymentMethod: subscription.paymentMethod,
      lastPaymentDate: subscription.lastPaymentDate,
    });
  });
}
