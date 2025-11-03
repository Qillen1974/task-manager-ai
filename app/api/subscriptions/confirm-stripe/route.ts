import { NextRequest } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { getTokenFromHeader } from "@/lib/authUtils";
import { verifyToken } from "@/lib/authUtils";
import { success, handleApiError } from "@/lib/apiResponse";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-04-10",
});

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
      return {
        success: false,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" }
      };
    }

    const decoded = verifyToken(token, "access");
    if (!decoded) {
      return {
        success: false,
        error: { message: "Invalid token", code: "INVALID_TOKEN" }
      };
    }

    const userId = decoded.userId;
    const { paymentIntentId, plan } = (await request.json()) as ConfirmRequest;

    if (!paymentIntentId || !plan) {
      return {
        success: false,
        error: { message: "Missing required fields", code: "MISSING_FIELDS" }
      };
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return {
        success: false,
        error: {
          message: `Payment not completed. Status: ${paymentIntent.status}`,
          code: "PAYMENT_NOT_COMPLETED"
        }
      };
    }

    // Verify the payment belongs to this user
    if (paymentIntent.metadata?.userId !== userId) {
      return {
        success: false,
        error: { message: "Payment does not match user", code: "USER_MISMATCH" }
      };
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return {
        success: false,
        error: { message: "User not found", code: "USER_NOT_FOUND" }
      };
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
