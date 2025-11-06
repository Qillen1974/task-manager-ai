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
  billingCycle: "monthly" | "annual";
}

/**
 * POST /api/subscriptions/upgrade-stripe
 * Create a Stripe Subscription for recurring billing
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
    const { plan, billingCycle } = (await request.json()) as UpgradeRequest;

    if (!plan || !billingCycle) {
      return error("Invalid plan or billing cycle", 400, "INVALID_INPUT");
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
    if (!priceId) {
      return error("Invalid plan or billing cycle configuration", 400, "INVALID_PRICE_ID");
    }

    const stripeClient = getStripeClient();

    // Get or create a Stripe customer
    let stripeCustomerId = user.subscription?.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripeClient.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId,
        },
      });
      stripeCustomerId = customer.id;
    }

    // If user already has a subscription, update it. Otherwise, create a new one.
    let subscription: Stripe.Subscription;
    if (user.subscription?.stripeSubId) {
      // Update existing subscription
      subscription = await stripeClient.subscriptions.update(
        user.subscription.stripeSubId,
        {
          items: [
            {
              id: (await stripeClient.subscriptions.retrieve(user.subscription.stripeSubId)).items
                .data[0]?.id,
              price: priceId,
            },
          ],
          proration_behavior: "create_prorations",
        }
      );
    } else {
      // Don't create subscription yet - create a payment intent first
      // After payment succeeds, we'll create the subscription
      // This way we collect payment before creating recurring billing
    }

    // Create a payment intent for the first payment
    // After payment confirms, the confirm endpoint will create the subscription
    const price = PLAN_DETAILS[plan].price;
    const finalPrice = getPrice(price, billingCycle);
    const amountInCents = Math.round(finalPrice * 100);

    const paymentIntent = await stripeClient.paymentIntents.create({
      customer: stripeCustomerId,
      amount: amountInCents,
      currency: "usd",
      payment_method_types: ["card"],
      metadata: {
        userId,
        plan,
        billingCycle,
      },
      description: `${plan} plan subscription (${billingCycle})`,
    });

    return success({
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
      plan,
      billingCycle,
    });
  });
}

// Helper to calculate price with discounts
const PLAN_DETAILS: Record<string, { price: number }> = {
  FREE: { price: 0 },
  PRO: { price: 4.99 },
  ENTERPRISE: { price: 9.99 },
};

function getPrice(basePrice: number, billingCycle: "monthly" | "annual") {
  if (billingCycle === "annual" && basePrice > 0) {
    const discountPercent = basePrice === 4.99 ? 20 : 17;
    const annualPrice = basePrice * 12;
    const discount = annualPrice * (discountPercent / 100);
    return annualPrice - discount;
  }
  return basePrice;
}
