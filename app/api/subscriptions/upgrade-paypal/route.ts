import { NextRequest } from "next/server";
import { Client, Environment, LogLevel } from "@paypal/paypal-server-sdk";
import { db } from "@/lib/db";
import { getTokenFromHeader } from "@/lib/authUtils";
import { verifyToken } from "@/lib/authUtils";
import { success, handleApiError } from "@/lib/apiResponse";
import { validateDowngrade } from "@/lib/subscriptionValidation";

interface UpgradeRequest {
  plan: "FREE" | "PRO" | "ENTERPRISE";
  amount: string; // Amount as a string (e.g., "29.99")
}

// Initialize PayPal client
const paypalClient = new Client({
  clientId: process.env.PAYPAL_CLIENT_ID || "",
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
  environment:
    process.env.NODE_ENV === "production"
      ? Environment.Production
      : Environment.Sandbox,
  logging: {
    logLevel: LogLevel.Info,
  },
});

/**
 * POST /api/subscriptions/upgrade-paypal
 * Create a PayPal order for subscription upgrade
 */
export async function POST(request: NextRequest) {
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
    const { plan, amount } = (await request.json()) as UpgradeRequest;

    if (!plan || !amount || parseFloat(amount) <= 0) {
      return {
        success: false,
        error: { message: "Invalid plan or amount", code: "INVALID_INPUT" },
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
        error: { message: "User not found", code: "USER_NOT_FOUND" },
      };
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
        return {
          success: false,
          error: {
            message: downgradeValidation.message || "Cannot downgrade plan due to item limits",
            code: "DOWNGRADE_VALIDATION_FAILED"
          }
        };
      }
    }

    // Create PayPal order
    const ordersController = paypalClient.ordersController;
    const request_body = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount,
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: amount,
              },
            },
          },
          description: `TaskQuadrant subscription upgrade to ${plan} plan`,
          items: [
            {
              name: `${plan} Plan Subscription`,
              description: `Upgrade to ${plan} plan for TaskQuadrant`,
              unit_amount: {
                currency_code: "USD",
                value: amount,
              },
              quantity: "1",
            },
          ],
          custom_id: userId,
          metadata: {
            plan,
            userId,
            userEmail: user.email,
          },
        },
      ],
      application_context: {
        brand_name: "TaskQuadrant",
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=membership&status=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=membership&status=cancelled`,
        user_action: "PAY_NOW",
      },
    };

    const { body: order, statusCode } =
      await ordersController.ordersCreate(request_body);

    if (statusCode !== 201) {
      return {
        success: false,
        error: {
          message: "Failed to create PayPal order",
          code: "PAYPAL_ORDER_CREATION_FAILED",
        },
      };
    }

    return success({
      orderId: order?.result?.id,
      plan,
      amount,
      approvalLink: order?.result?.links?.find(
        (link: any) => link?.rel === "approve"
      )?.href,
    });
  });
}
