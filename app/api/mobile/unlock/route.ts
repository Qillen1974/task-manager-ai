import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromHeader, verifyToken } from "@/lib/authUtils";
import { success, error, handleApiError } from "@/lib/apiResponse";

// Mark as dynamic since it uses request.headers
export const dynamic = "force-dynamic";

// Apple's App Store Server API endpoints
const APPLE_PRODUCTION_VERIFY_URL = "https://buy.itunes.apple.com/verifyReceipt";
const APPLE_SANDBOX_VERIFY_URL = "https://sandbox.itunes.apple.com/verifyReceipt";

// Your app's shared secret from App Store Connect
const APP_SHARED_SECRET = process.env.APPLE_APP_SHARED_SECRET || "";

// Product ID for the mobile unlock purchase
const MOBILE_UNLOCK_PRODUCT_ID = "com.taskquadrant.mobile.unlock";

interface AppleVerifyResponse {
  status: number;
  receipt?: {
    in_app?: Array<{
      product_id: string;
      transaction_id: string;
      purchase_date_ms: string;
    }>;
  };
  latest_receipt_info?: Array<{
    product_id: string;
    transaction_id: string;
    purchase_date_ms: string;
  }>;
}

/**
 * Verify receipt with Apple's servers
 * First tries production, then sandbox if production fails with status 21007
 */
async function verifyAppleReceipt(receiptData: string): Promise<AppleVerifyResponse | null> {
  const requestBody = {
    "receipt-data": receiptData,
    "password": APP_SHARED_SECRET,
    "exclude-old-transactions": true,
  };

  try {
    // Try production first
    let response = await fetch(APPLE_PRODUCTION_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    let result: AppleVerifyResponse = await response.json();

    // Status 21007 means the receipt is from sandbox - retry with sandbox URL
    if (result.status === 21007) {
      response = await fetch(APPLE_SANDBOX_VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      result = await response.json();
    }

    return result;
  } catch (err) {
    console.error("[Mobile Unlock] Failed to verify receipt with Apple:", err);
    return null;
  }
}

/**
 * POST /api/mobile/unlock
 * Verify Apple IAP receipt and unlock mobile features
 *
 * Body: { receiptData: string }
 *
 * The receiptData is the base64-encoded receipt from StoreKit
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    // Verify user is authenticated
    const authHeader = request.headers.get("authorization");
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      return error("Unauthorized", 401);
    }

    const decoded = verifyToken(token, "access");
    if (!decoded) {
      return error("Invalid token", 401);
    }

    const userId = decoded.userId;

    // Parse request body
    const body = await request.json();
    const { receiptData, transactionId } = body;

    if (!receiptData) {
      return error("Receipt data is required", 400);
    }

    // Check if user already has mobile unlock
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { mobileUnlocked: true, email: true },
    });

    if (!user) {
      return error("User not found", 404);
    }

    if (user.mobileUnlocked) {
      return success({
        message: "Mobile features already unlocked",
        mobileUnlocked: true,
      });
    }

    // Verify receipt with Apple
    const verificationResult = await verifyAppleReceipt(receiptData);

    if (!verificationResult) {
      return error("Failed to verify receipt with Apple", 500);
    }

    // Check verification status
    // Status 0 = valid receipt
    if (verificationResult.status !== 0) {
      console.error(`[Mobile Unlock] Apple verification failed with status: ${verificationResult.status}`);
      return error(`Receipt verification failed (status: ${verificationResult.status})`, 400);
    }

    // Check for the mobile unlock product in the receipt
    const allPurchases = [
      ...(verificationResult.receipt?.in_app || []),
      ...(verificationResult.latest_receipt_info || []),
    ];

    const mobileUnlockPurchase = allPurchases.find(
      (purchase) => purchase.product_id === MOBILE_UNLOCK_PRODUCT_ID
    );

    if (!mobileUnlockPurchase) {
      console.error(`[Mobile Unlock] Product ${MOBILE_UNLOCK_PRODUCT_ID} not found in receipt`);
      return error("Mobile unlock purchase not found in receipt", 400);
    }

    // Valid purchase found - unlock mobile features
    await db.user.update({
      where: { id: userId },
      data: {
        mobileUnlocked: true,
      },
    });

    console.log(`[Mobile Unlock] Successfully unlocked for user: ${user.email}, transaction: ${mobileUnlockPurchase.transaction_id}`);

    return success({
      message: "Mobile features unlocked successfully",
      mobileUnlocked: true,
      transactionId: mobileUnlockPurchase.transaction_id,
      purchaseDate: new Date(parseInt(mobileUnlockPurchase.purchase_date_ms)).toISOString(),
    });
  });
}

/**
 * GET /api/mobile/unlock
 * Check if user has mobile unlock
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    // Verify user is authenticated
    const authHeader = request.headers.get("authorization");
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      return error("Unauthorized", 401);
    }

    const decoded = verifyToken(token, "access");
    if (!decoded) {
      return error("Invalid token", 401);
    }

    const userId = decoded.userId;

    // Get user's mobile unlock status
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        mobileUnlocked: true,
        isBetaTester: true,
        subscription: {
          select: { plan: true },
        },
      },
    });

    if (!user) {
      return error("User not found", 404);
    }

    // Check if beta mode is active
    const betaModeActive = process.env.MOBILE_BETA_MODE === "true";

    // User has premium access if any of these are true
    const hasPremiumAccess =
      betaModeActive ||
      user.mobileUnlocked ||
      user.isBetaTester ||
      user.subscription?.plan === "PRO" ||
      user.subscription?.plan === "ENTERPRISE";

    return success({
      mobileUnlocked: user.mobileUnlocked,
      isBetaTester: user.isBetaTester,
      betaModeActive,
      subscriptionPlan: user.subscription?.plan || "FREE",
      hasPremiumAccess,
    });
  });
}
