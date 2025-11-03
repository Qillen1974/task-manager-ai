import { NextRequest } from "next/server";
import { Client, Environment, LogLevel } from "@paypal/paypal-server-sdk";
import { db } from "@/lib/db";
import { getTokenFromHeader } from "@/lib/authUtils";
import { verifyToken } from "@/lib/authUtils";
import { success, handleApiError } from "@/lib/apiResponse";

interface ConfirmRequest {
  orderId: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
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
 * POST /api/subscriptions/confirm-paypal
 * Confirm PayPal payment and update subscription
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
    const { orderId, plan } = (await request.json()) as ConfirmRequest;

    if (!orderId || !plan) {
      return {
        success: false,
        error: { message: "Missing required fields", code: "MISSING_FIELDS" },
      };
    }

    // Capture the PayPal order
    const ordersController = paypalClient.ordersController;
    const { body: orderDetails, statusCode } =
      await ordersController.ordersCapture({
        id: orderId,
      });

    if (statusCode !== 201) {
      return {
        success: false,
        error: {
          message: "Failed to capture PayPal order",
          code: "PAYPAL_CAPTURE_FAILED",
        },
      };
    }

    // Verify order status is completed
    if (
      orderDetails?.result?.status !== "COMPLETED" &&
      orderDetails?.result?.status !== "APPROVED"
    ) {
      return {
        success: false,
        error: {
          message: `Payment not completed. Status: ${orderDetails?.result?.status}`,
          code: "PAYMENT_NOT_COMPLETED",
        },
      };
    }

    // Verify the order belongs to this user
    if (orderDetails?.result?.purchase_units?.[0]?.custom_id !== userId) {
      return {
        success: false,
        error: { message: "Order does not match user", code: "USER_MISMATCH" },
      };
    }

    // Get the transaction ID from the order
    const transactionId =
      orderDetails?.result?.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
      orderId;

    // Get user
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
        paymentMethod: "paypal",
        lastPaymentId: transactionId,
        lastPaymentDate: new Date(),
      },
      update: {
        plan,
        projectLimit: limits.projectLimit,
        taskLimit: limits.taskLimit,
        paymentMethod: "paypal",
        lastPaymentId: transactionId,
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
