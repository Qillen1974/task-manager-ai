import { NextRequest } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { getTokenFromHeader } from "@/lib/authUtils";
import { verifyToken } from "@/lib/authUtils";
import { success, error, handleApiError } from "@/lib/apiResponse";
import { PROJECT_LIMITS, TASK_LIMITS } from "@/lib/projectLimits";

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
  setupIntentId: string;
  paymentMethodId: string | object;
  plan: "FREE" | "PRO" | "ENTERPRISE";
}

/**
 * POST /api/subscriptions/confirm-stripe
 * Create recurring subscription with confirmed payment method
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
    const { setupIntentId, paymentMethodId, plan } = (await request.json()) as ConfirmRequest;

    if (!setupIntentId || !paymentMethodId || !plan) {
      return error("Missing required fields", 400, "MISSING_FIELDS");
    }

    // Retrieve setup intent from Stripe
    const stripeClient = getStripeClient();
    const setupIntent = await stripeClient.setupIntents.retrieve(setupIntentId);

    // Verify setup intent succeeded
    if (setupIntent.status !== "succeeded") {
      return error(
        `Card setup not completed. Status: ${setupIntent.status}`,
        400,
        "SETUP_NOT_COMPLETED"
      );
    }

    // Verify the setup intent belongs to this user
    if (setupIntent.metadata?.userId !== userId) {
      return error("Setup intent does not match user", 403, "USER_MISMATCH");
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return error("User not found", 404, "USER_NOT_FOUND");
    }

    // Get the plan details from the setup intent metadata
    const billingCycle = (setupIntent.metadata?.billingCycle as "monthly" | "annual") || "monthly";

    // Get customer ID from setup intent
    const customerId = setupIntent.customer as string;
    if (!customerId) {
      return error("No customer associated with setup", 400, "NO_CUSTOMER");
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

    // Create Stripe subscription with the payment method from the setup intent
    let subscription: Stripe.Subscription | null = null;
    if (plan !== "FREE") {
      const payMethodId = typeof paymentMethodId === "string" ? paymentMethodId : (paymentMethodId as any).id;

      try {
        // Create a user-friendly description for the subscription
        const billingCycleText = billingCycle === "annual" ? "yearly" : "monthly";
        const description = `TaskQuadrant ${plan} Plan subscription (${billingCycleText})`;

        subscription = await stripeClient.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          metadata: {
            userId,
            plan,
            billingCycle,
          },
          description: description,
          // Use the payment method from setup intent as default
          default_payment_method: payMethodId,
        });
      } catch (err: any) {
        // If subscription creation fails but one might already exist, try to find it
        console.log("Subscription creation error, checking if already exists:", err.message);

        // List subscriptions for this customer to see if one was created
        const subscriptions = await stripeClient.subscriptions.list({
          customer: customerId,
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          subscription = subscriptions.data[0];
          console.log("Found existing subscription:", subscription.id);
        } else {
          // No subscription found, re-throw the error
          throw err;
        }
      }
    }

    // Determine plan limits from centralized configuration
    const projectLimitValue = PROJECT_LIMITS[plan as keyof typeof PROJECT_LIMITS];
    const taskLimitValue = TASK_LIMITS[plan as keyof typeof TASK_LIMITS];

    const limits = {
      projectLimit: projectLimitValue.maxProjects === -1 ? 999999 : projectLimitValue.maxProjects,
      taskLimit: taskLimitValue.maxTasks === -1 ? 999999 : taskLimitValue.maxTasks,
    };

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
        lastPaymentId: setupIntentId,
        lastPaymentDate: new Date(),
      },
      update: {
        plan,
        projectLimit: limits.projectLimit,
        taskLimit: limits.taskLimit,
        paymentMethod: "stripe",
        stripeSubId: subscription?.id || null,
        stripeCustomerId: customerId,
        lastPaymentId: setupIntentId,
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
