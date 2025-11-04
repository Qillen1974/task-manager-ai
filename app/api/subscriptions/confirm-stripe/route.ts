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
  paymentIntentId: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
}

/**
 * POST /api/subscriptions/confirm-stripe
 * Confirm Stripe payment and update subscription
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
    const { paymentIntentId, plan } = (await request.json()) as ConfirmRequest;

    if (!paymentIntentId || !plan) {
      return error("Missing required fields", 400, "MISSING_FIELDS");
    }

    // Retrieve payment intent from Stripe
    const stripeClient = getStripeClient();
    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return error(
        `Payment not completed. Status: ${paymentIntent.status}`,
        400,
        "PAYMENT_NOT_COMPLETED"
      );
    }

    // Verify the payment belongs to this user
    if (paymentIntent.metadata?.userId !== userId) {
      return error("Payment does not match user", 403, "USER_MISMATCH");
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
      FREE: { projectLimit: 3, taskLimit: 50 },
      PRO: { projectLimit: 100, taskLimit: 500 },
      ENTERPRISE: { projectLimit: 999999, taskLimit: 999999 },
    };

    const limits = planLimits[plan];

    // Update or create subscription
    const updatedSubscription = await db.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        projectLimit: limits.projectLimit,
        taskLimit: limits.taskLimit,
        paymentMethod: "stripe",
        lastPaymentId: paymentIntentId,
        lastPaymentDate: new Date(),
      },
      update: {
        plan,
        projectLimit: limits.projectLimit,
        taskLimit: limits.taskLimit,
        paymentMethod: "stripe",
        lastPaymentId: paymentIntentId,
        lastPaymentDate: new Date(),
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
