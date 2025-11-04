import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromHeader } from "@/lib/authUtils";
import { verifyToken } from "@/lib/authUtils";
import { success, handleApiError } from "@/lib/apiResponse";
import { validateDowngrade } from "@/lib/subscriptionValidation";
import * as btoa from "btoa";

interface UpgradeRequest {
  plan: "FREE" | "PRO" | "ENTERPRISE";
  amount: string; // Amount as a string (e.g., "29.99")
}

const PAYPAL_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.paypal.com"
    : "https://api.sandbox.paypal.com";

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

    // Create PayPal order using REST API
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return {
        success: false,
        error: { message: "PayPal credentials not configured", code: "PAYPAL_CONFIG_ERROR" },
      };
    }

    // Get PayPal access token
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString("base64");

    const tokenResponse = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const tokenData: any = await tokenResponse.json();
    if (!tokenData.access_token) {
      return {
        success: false,
        error: { message: "Failed to get PayPal access token", code: "PAYPAL_TOKEN_ERROR" },
      };
    }

    // Create order
    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount,
          },
          description: `TaskQuadrant subscription upgrade to ${plan} plan`,
          custom_id: userId,
        },
      ],
      application_context: {
        brand_name: "TaskQuadrant",
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`,
        user_action: "PAY_NOW",
      },
    };

    const orderResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    const orderData: any = await orderResponse.json();

    if (!orderResponse.ok || !orderData.id) {
      return {
        success: false,
        error: {
          message: orderData.message || "Failed to create PayPal order",
          code: "PAYPAL_ORDER_CREATION_FAILED",
        },
      };
    }

    // Find the approval link
    const approvalLink = orderData.links?.find(
      (link: any) => link.rel === "approve"
    )?.href;

    return success({
      orderId: orderData.id,
      plan,
      amount,
      approvalLink,
    });
  });
}
