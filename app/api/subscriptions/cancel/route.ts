import { NextRequest } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { getTokenFromHeader } from "@/lib/authUtils";
import { verifyToken } from "@/lib/authUtils";
import { success, error, handleApiError } from "@/lib/apiResponse";

// Lazy initialize Stripe client
let stripe: Stripe | null = null;
function getStripeClient() {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-04-10",
    });
  }
  return stripe;
}

/**
 * POST /api/subscriptions/cancel
 * Cancel user's active subscription and downgrade to FREE plan
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    // Verify user is authenticated
    const authHeader = request.headers.get("authorization");
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      return error("Unauthorized", 401, "UNAUTHORIZED");
    }

    const decoded = verifyToken(token, "access");
    if (!decoded) {
      return error("Invalid token", 401, "INVALID_TOKEN");
    }

    const userId = decoded.userId;

    // Get user and their subscription
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return error("User not found", 404, "USER_NOT_FOUND");
    }

    // Check if user has an active subscription
    if (!user.subscription || !user.subscription.stripeSubId) {
      return error(
        "User does not have an active subscription",
        400,
        "NO_ACTIVE_SUBSCRIPTION"
      );
    }

    // Check if already on FREE plan
    if (user.subscription.plan === "FREE") {
      return error("User is already on the FREE plan", 400, "ALREADY_FREE");
    }

    const stripeClient = getStripeClient();

    try {
      // Cancel the Stripe subscription
      const cancelledSubscription = await stripeClient.subscriptions.cancel(
        user.subscription.stripeSubId
      );

      console.log(
        `Subscription ${user.subscription.stripeSubId} cancelled. Status: ${cancelledSubscription.status}`
      );

      // Update database to downgrade to FREE plan
      const updatedSubscription = await db.subscription.update({
        where: { userId },
        data: {
          plan: "FREE",
          projectLimit: 10,
          taskLimit: 50,
          stripeSubId: null,
          paymentMethod: null,
        },
      });

      return success({
        message: "Subscription cancelled successfully",
        subscription: updatedSubscription,
        user: {
          id: user.id,
          email: user.email,
          plan: updatedSubscription.plan,
        },
      });
    } catch (err: any) {
      console.error("Stripe subscription cancellation error:", err.message);
      throw err;
    }
  });
}
