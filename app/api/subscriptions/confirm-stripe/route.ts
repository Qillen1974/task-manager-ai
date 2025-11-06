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
 * Confirm payment and create recurring subscription
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

    // Verify payment succeeded
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

    // Get the plan details from the payment intent metadata
    const billingCycle = (paymentIntent.metadata?.billingCycle as "monthly" | "annual") || "monthly";

    // Get customer ID from payment intent
    const customerId = paymentIntent.customer as string;
    if (!customerId) {
      return error("No customer associated with payment", 400, "NO_CUSTOMER");
    }

    // Get the appropriate Stripe Price ID based on plan and billing cycle
    const priceIdMap: Record<string, Record<string, string>> = {
      PRO: {
        monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "",
        annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || "",
      },
      ENTERPRISE: {
        monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || "",
        annual: process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID || "",
      },
    };

    const priceId = priceIdMap[plan]?.[billingCycle];
    if (!priceId && plan !== "FREE") {
      return error("Invalid plan or billing cycle configuration", 400, "INVALID_PRICE_ID");
    }

    // Create Stripe subscription with the payment method from the payment intent
    let subscription: Stripe.Subscription | null = null;
    if (plan !== "FREE") {
      const paymentMethodId = paymentIntent.payment_method as string;

      // First, attach the payment method to the customer
      try {
        await stripeClient.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });
      } catch (err: any) {
        // Payment method might already be attached, continue anyway
        console.log("Payment method attachment note:", err.message);
      }

      subscription = await stripeClient.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata: {
          userId,
          plan,
          billingCycle,
        },
        // Use the attached payment method as default
        default_payment_method: paymentMethodId,
      });
    }

    // Determine plan limits
    const planLimits = {
      FREE: { projectLimit: 10, taskLimit: 50 },
      PRO: { projectLimit: 30, taskLimit: 200 },
      ENTERPRISE: { projectLimit: 999999, taskLimit: 999999 },
    };

    const limits = planLimits[plan];

    // Update or create subscription in database
    const updatedSubscription = await db.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        projectLimit: limits.projectLimit,
        taskLimit: limits.taskLimit,
        paymentMethod: "stripe",
        stripeSubId: subscription?.id || null,
        stripeCustomerId: customerId,
        lastPaymentId: paymentIntentId,
        lastPaymentDate: new Date(),
      },
      update: {
        plan,
        projectLimit: limits.projectLimit,
        taskLimit: limits.taskLimit,
        paymentMethod: "stripe",
        stripeSubId: subscription?.id || null,
        stripeCustomerId: customerId,
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
