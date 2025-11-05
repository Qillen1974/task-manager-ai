import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromHeader } from "@/lib/authUtils";
import { verifyToken } from "@/lib/authUtils";
import { success, error, handleApiError } from "@/lib/apiResponse";
import { validateDowngrade } from "@/lib/subscriptionValidation";
import * as btoa from "btoa";

interface UpgradeRequest {
  plan: "FREE" | "PRO" | "ENTERPRISE";
  amount: string; // Amount as a string (e.g., "29.99")
}

// Use live PayPal API for production
const isPayPalSandbox = false; // Set to true for sandbox testing, false for live
const PAYPAL_BASE_URL = isPayPalSandbox
  ? "https://api.sandbox.paypal.com"
  : "https://api.paypal.com";

/**
 * POST /api/subscriptions/upgrade-paypal
 * Create a PayPal order for subscription upgrade
 */
export async function POST(request: NextRequest) {
  try {
    console.log("=== upgrade-paypal endpoint called ===");
    // Verify user is authenticated
    const authHeader = request.headers.get("authorization");
    const token = getTokenFromHeader(authHeader);
    console.log("Token exists:", !!token);

    if (!token) {
      return error("Unauthorized", 401, "UNAUTHORIZED");
    }

    const decoded = verifyToken(token, "access");
    if (!decoded) {
      return error("Invalid token", 401, "INVALID_TOKEN");
    }

    const userId = decoded.userId;
    console.log("User ID:", userId);
    const { plan, amount } = (await request.json()) as UpgradeRequest;
    console.log("Request body parsed:", { plan, amount });

    if (!plan || !amount || parseFloat(amount) <= 0) {
      return error("Invalid plan or amount", 400, "INVALID_INPUT");
    }

    // Get user details
    console.log("Fetching user details...");
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
      console.log("Validating downgrade...");
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

    // Create PayPal order using REST API
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      console.error("PayPal credentials missing");
      return error("PayPal credentials not configured", 500, "PAYPAL_CONFIG_ERROR");
    }

    // Get PayPal access token
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString("base64");

    console.log("Getting PayPal access token...");
    const tokenResponse = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const tokenData: any = await tokenResponse.json();
    console.log("Token response:", { status: tokenResponse.status, hasAccessToken: !!tokenData.access_token });
    if (!tokenData.access_token) {
      console.error("PayPal token error:", tokenData);
      return error("Failed to get PayPal access token", 500, "PAYPAL_TOKEN_ERROR");
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
        user_action: "CONTINUE",
        locale: "en-US",
      },
    };

    console.log("Creating PayPal order...");
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
      console.error("PayPal order creation failed:", orderData);
      return error(
        orderData.message || "Failed to create PayPal order",
        500,
        "PAYPAL_ORDER_CREATION_FAILED"
      );
    }

    // Find the approval link
    const approvalLink = orderData.links?.find(
      (link: any) => link.rel === "approve"
    )?.href;

    console.log("PayPal order created successfully:", orderData.id);
    console.log("PayPal order status:", orderData.status);
    console.log("PayPal order links:", JSON.stringify(orderData.links, null, 2));
    console.log("Approval link:", approvalLink);

    if (!approvalLink) {
      console.error("No approval link found in PayPal response");
      console.error("Full order data:", JSON.stringify(orderData, null, 2));
    }

    return success({
      orderId: orderData.id,
      plan,
      amount,
      approvalLink,
    });
  } catch (err: any) {
    console.error("ERROR in upgrade-paypal endpoint:", err);
    console.error("Error stack:", err.stack);
    return error(
      err.message || "Failed to create PayPal order",
      500,
      "INTERNAL_ERROR"
    );
  }
}
