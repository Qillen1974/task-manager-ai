import { NextRequest } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { getTokenFromHeader } from "@/lib/authUtils";
import { verifyToken } from "@/lib/authUtils";
import { success, error, handleApiError } from "@/lib/apiResponse";
import { validateDowngrade } from "@/lib/subscriptionValidation";

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

interface UpgradeRequest {
  plan: "FREE" | "PRO" | "ENTERPRISE";
  amount: number; // Amount in cents
}

/**
 * POST /api/subscriptions/upgrade-stripe
 * Create a Stripe payment intent for subscription upgrade
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
    const { plan, amount } = (await request.json()) as UpgradeRequest;

    if (!plan || !amount || amount <= 0) {
      return error("Invalid plan or amount", 400, "INVALID_INPUT");
    }

    // Get user details
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return error("User not found", 404, "USER_NOT_FOUND");
    }

    // Check if this is a downgrade and validate
    const currentPlan = user.subscription?.plan || "FREE";
    const newPlan = plan as "FREE" | "PRO" | "ENTERPRISE";

    // Only validate if plan is different and it's a downgrade
    if (plan !== currentPlan) {
      const rootProjectCount = await db.project.count({
        where: {
          userId,
          parentProjectId: null,
        },
      });

      const taskCount = await db.task.count({
        where: { userId },
      });

      const downgradeValidation = validateDowngrade(newPlan, rootProjectCount, taskCount);

      if (!downgradeValidation.allowed) {
        return error(
          downgradeValidation.message || "Cannot downgrade plan due to item limits",
          400,
          "DOWNGRADE_VALIDATION_FAILED"
        );
      }
    }

    // Create payment intent
    const stripeClient = getStripeClient();
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount, // Amount in cents
      currency: "usd",
      payment_method_types: ["card"],
      metadata: {
        userId,
        userEmail: user.email,
        plan,
        subscriptionId: user.subscription?.id || "new",
      },
      description: `TaskQuadrant subscription upgrade to ${plan} plan for ${user.email}`,
    });

    return success({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      plan,
    });
  });
}
