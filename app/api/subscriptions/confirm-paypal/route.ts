import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromHeader } from "@/lib/authUtils";
import { verifyToken } from "@/lib/authUtils";

// Use live PayPal API for production
const isPayPalSandbox = false; // Set to true for sandbox testing, false for live
const PAYPAL_BASE_URL = isPayPalSandbox
  ? "https://api.sandbox.paypal.com"
  : "https://api.paypal.com";

interface ConfirmRequest {
  orderId: string;
  plan: string;
}

/**
 * POST /api/subscriptions/confirm-paypal
 * Confirm PayPal payment and update subscription
 */
export async function POST(request: NextRequest) {
  try {
    console.log("Confirm PayPal endpoint called");
    // Verify user is authenticated
    const authHeader = request.headers.get("authorization");
    const token = getTokenFromHeader(authHeader);
    console.log("Token:", !!token);

    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token, "access");
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid token", code: "INVALID_TOKEN" } },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    let parsedBody: ConfirmRequest;
    try {
      parsedBody = (await request.json()) as ConfirmRequest;
    } catch (e: any) {
      console.error("Error parsing request body:", e);
      return NextResponse.json(
        { success: false, error: { message: "Invalid request body", code: "INVALID_BODY" } },
        { status: 400 }
      );
    }
    const { orderId, plan } = parsedBody;

    console.log("Received confirm-paypal request:", { orderId, plan, userId });

    if (!orderId || !plan) {
      console.error("Missing fields - orderId:", orderId, "plan:", plan);
      return NextResponse.json(
        { success: false, error: { message: "Missing required fields", code: "MISSING_FIELDS" } },
        { status: 400 }
      );
    }

    // Get PayPal access token
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return NextResponse.json(
        { success: false, error: { message: "PayPal credentials not configured", code: "PAYPAL_CONFIG_ERROR" } },
        { status: 500 }
      );
    }

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
      return NextResponse.json(
        { success: false, error: { message: "Failed to get PayPal access token", code: "PAYPAL_TOKEN_ERROR" } },
        { status: 500 }
      );
    }

    // Get order details from PayPal
    const orderResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
    });

    const orderData: any = await orderResponse.json();

    if (!orderResponse.ok || !orderData.id) {
      return NextResponse.json(
        { success: false, error: { message: "Failed to retrieve PayPal order", code: "PAYPAL_ORDER_RETRIEVE_FAILED" } },
        { status: 500 }
      );
    }

    // Check if order is approved
    console.log("PayPal order status:", orderData.status);

    // If order is CREATED, it means the approval might not have been processed yet
    // Try to capture anyway - PayPal will update the status if it's actually been approved
    if (orderData.status !== "APPROVED" && orderData.status !== "CREATED") {
      console.error("PayPal order not in valid status. Status:", orderData.status);
      return NextResponse.json(
        { success: false, error: { message: `Payment status invalid. Status: ${orderData.status}`, code: "PAYMENT_INVALID_STATUS" } },
        { status: 400 }
      );
    }

    if (orderData.status === "CREATED") {
      console.log("Order in CREATED status, attempting capture anyway (PayPal may auto-approve on capture)");
    }

    // Capture the order (complete the payment)
    const captureResponse = await fetch(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    const captureData: any = await captureResponse.json();

    console.log("PayPal capture response status:", captureData.status);
    console.log("Capture response OK:", captureResponse.ok);

    // Handle case where order was already captured
    if (captureData.issue === "ORDER_ALREADY_CAPTURED" ||
        captureData.message?.includes("ORDER_ALREADY_CAPTURED")) {
      console.log("Order already captured in a previous request, proceeding with subscription update");
      // Order was already captured in a previous request, treat as success
    } else if (!captureResponse.ok || captureData.status !== "COMPLETED") {
      console.error("PayPal capture failed. Response:", captureData);
      return NextResponse.json(
        { success: false, error: { message: "Failed to capture PayPal payment", code: "PAYPAL_CAPTURE_FAILED" } },
        { status: 500 }
      );
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "User not found", code: "USER_NOT_FOUND" } },
        { status: 404 }
      );
    }

    // Determine plan limits
    const planLimits: Record<string, { projectLimit: number; taskLimit: number }> = {
      FREE: { projectLimit: 10, taskLimit: 50 },
      PRO: { projectLimit: 30, taskLimit: 200 },
      ENTERPRISE: { projectLimit: 999999, taskLimit: 999999 },
    };

    const limits = planLimits[plan];
    if (!limits) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid plan", code: "INVALID_PLAN" } },
        { status: 400 }
      );
    }

    // Update or create subscription
    console.log("Updating subscription for user:", userId, "to plan:", plan);
    const updatedSubscription = await db.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        projectLimit: limits.projectLimit,
        taskLimit: limits.taskLimit,
        paymentMethod: "paypal",
        lastPaymentId: orderId,
        lastPaymentDate: new Date(),
      },
      update: {
        plan,
        projectLimit: limits.projectLimit,
        taskLimit: limits.taskLimit,
        paymentMethod: "paypal",
        lastPaymentId: orderId,
        lastPaymentDate: new Date(),
      },
    });

    console.log("Subscription updated successfully:", updatedSubscription);

    const successResponse = NextResponse.json(
      {
        success: true,
        data: {
          message: `Successfully upgraded to ${plan} plan`,
          subscription: updatedSubscription,
          user: {
            id: user.id,
            email: user.email,
            plan: updatedSubscription.plan,
          },
        },
      },
      { status: 200 }
    );
    return successResponse;
  } catch (err: any) {
    console.error("Error in confirm-paypal endpoint:", err);
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: { message: err.message || "Failed to confirm PayPal payment", code: "INTERNAL_ERROR" },
      },
      { status: 500 }
    );
    return errorResponse;
  }
}
