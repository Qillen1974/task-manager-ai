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

interface ConfirmRequest {
  subscriptionId: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
}

/**
 * POST /api/subscriptions/confirm-stripe
 * Confirm Stripe subscription setup and update subscription
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
    const { subscriptionId, plan } = (await request.json()) as ConfirmRequest;

    if (!subscriptionId || !plan) {
      return error("Missing required fields", 400, "MISSING_FIELDS");
    }

    // Retrieve subscription from Stripe
    const stripeClient = getStripeClient();
    const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);

    // Verify subscription is in a valid state (incomplete_expired is terminal state)
    if (subscription.status === "incomplete_expired") {
      return error(
        "Subscription setup expired. Please try again.",
        400,
        "SUBSCRIPTION_EXPIRED"
      );
    }

    // Verify the subscription belongs to this user
    if (subscription.metadata?.userId !== userId) {
      return error("Subscription does not match user", 403, "USER_MISMATCH");
    }

    // If subscription is incomplete, try to resume it (this will attempt to charge with the attached payment method)
    if (subscription.status === "incomplete") {
      try {
        const resumed = await stripeClient.subscriptions.update(subscriptionId, {
          off_session: true,
        });
        // Note: The subscription may still be incomplete if payment fails
        // Webhook handlers will manage status updates
      } catch (err: any) {
        // Subscription may need manual intervention if payment fails
        console.error("Failed to resume subscription:", err);
      }
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return error("User not found", 404, "USER_NOT_FOUND");
    }

    // Determine plan limits
    const planLimits = {
      FREE: { projectLimit: 10, taskLimit: 50 },
      PRO: { projectLimit: 30, taskLimit: 200 },
      ENTERPRISE: { projectLimit: 999999, taskLimit: 999999 },
    };

    const limits = planLimits[plan];

    // Get the current period start date from subscription
    const currentPeriodStart = (subscription as any).current_period_start
      ? new Date((subscription as any).current_period_start * 1000)
      : new Date();

    const lastPaymentId = subscription.latest_invoice
      ? typeof subscription.latest_invoice === "string"
        ? subscription.latest_invoice
        : (subscription.latest_invoice as Stripe.Invoice).id
      : null;

    // Update or create subscription
    const updatedSubscription = await db.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        projectLimit: limits.projectLimit,
        taskLimit: limits.taskLimit,
        paymentMethod: "stripe",
        stripeSubId: subscriptionId,
        stripeCustomerId: subscription.customer as string,
        lastPaymentId: lastPaymentId,
        lastPaymentDate: currentPeriodStart,
      },
      update: {
        plan,
        projectLimit: limits.projectLimit,
        taskLimit: limits.taskLimit,
        paymentMethod: "stripe",
        stripeSubId: subscriptionId,
        stripeCustomerId: subscription.customer as string,
        lastPaymentId: lastPaymentId,
        lastPaymentDate: currentPeriodStart,
      },
    });

    return success({
      message: `Successfully upgraded to ${plan} plan`,
      subscription: updatedSubscription,
      user: {
        id: user.id,
        email: user.email,
        plan: updatedSubscription.plan,
      },
    });
  });
}
