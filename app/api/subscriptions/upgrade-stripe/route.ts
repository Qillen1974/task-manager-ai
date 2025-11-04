import { NextRequest } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { getTokenFromHeader } from "@/lib/authUtils";
import { verifyToken } from "@/lib/authUtils";
import { success, handleApiError } from "@/lib/apiResponse";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-04-10",
});

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
    const { plan, amount } = (await request.json()) as UpgradeRequest;

    if (!plan || !amount || amount <= 0) {
      return {
        success: false,
        error: { message: "Invalid plan or amount", code: "INVALID_INPUT" }
      };
    }

    // Get user details
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

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
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
