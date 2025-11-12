"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Metadata } from "next";
import axios from "axios";
import UpgradeMembership from "@/components/UpgradeMembership";
import { trackSubscriptionConversion } from "@/lib/gtagUtils";

export const metadata: Metadata = {
  title: "Upgrade Your Plan - TaskQuadrant Pro & Enterprise",
  description: "Upgrade to TaskQuadrant Pro or Enterprise plan for unlimited projects, advanced features, and dedicated support.",
};

export const dynamic = "force-dynamic";

interface Subscription {
  id: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  projectLimit: number;
  taskLimit: number;
}

export default function UpgradePage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [paypalPending, setPaypalPending] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const [paypalCountdown, setPaypalCountdown] = useState(0);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/login");
          return;
        }

        // Check if this is a PayPal return from the URL query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const paypalToken = urlParams.get("token");

        // Check if this is a PayPal return (check localStorage instead of sessionStorage)
        const paypalOrderId = localStorage.getItem("paypal_order_id");
        const paypalPlan = localStorage.getItem("paypal_plan");

        console.log("PayPal return detected - Token:", paypalToken, "OrderID:", paypalOrderId, "Plan:", paypalPlan);

        if (paypalToken && paypalOrderId && paypalPlan) {
          // User has returned from PayPal
          console.log("=== PayPal Return Detected ===");
          console.log("PayPal Token:", paypalToken);
          console.log("Order ID:", paypalOrderId);

          // Mark that we're waiting for payment confirmation
          // Don't auto-confirm yet - wait a moment in case PayPal is still redirecting
          setPaypalPending(true);
          setPaypalError(null);

          // Delay confirmation attempt to ensure PayPal has completed the approval flow
          const delayMs = 10000; // 10 seconds
          setPaypalCountdown(delayMs / 1000);

          const countdownInterval = setInterval(() => {
            setPaypalCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(countdownInterval);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          const confirmTimeout = setTimeout(async () => {
            clearInterval(countdownInterval);
            try {
              console.log("Attempting to confirm PayPal payment...");
              const confirmResponse = await axios.post(
                "/api/subscriptions/confirm-paypal",
                {
                  orderId: paypalOrderId,
                  plan: paypalPlan,
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              console.log("Confirm-PayPal response:", confirmResponse.data);

              if (confirmResponse.data.success) {
                // Track conversion in Google Ads
                trackSubscriptionConversion();

                // Clear localStorage after successful confirmation
                localStorage.removeItem("paypal_order_id");
                localStorage.removeItem("paypal_plan");
                localStorage.removeItem("paypal_billing_cycle");

                // Clear URL query parameter
                window.history.replaceState({}, document.title, "/upgrade");

                // Update subscription
                setSubscription(confirmResponse.data.data.subscription);
                setPaypalPending(false);
                console.log("PayPal payment confirmed successfully");
                // Redirect to settings with success message
                router.push("/settings?tab=membership&status=upgraded");
                return;
              } else {
                const errorMessage = confirmResponse.data.error?.message || "Payment confirmation failed";
                console.error("Confirm-PayPal response not successful:", confirmResponse.data.error);
                setPaypalError(errorMessage);
                setPaypalPending(false);

                // Only clear localStorage if explicitly failed, not if pending
                if (confirmResponse.data.error?.code !== "PAYMENT_PENDING_APPROVAL") {
                  localStorage.removeItem("paypal_order_id");
                  localStorage.removeItem("paypal_plan");
                  localStorage.removeItem("paypal_billing_cycle");
                  window.history.replaceState({}, document.title, "/upgrade");
                }
              }
            } catch (err: any) {
              console.error("Failed to confirm PayPal payment:", err);
              setPaypalError(err.response?.data?.error?.message || "Failed to confirm payment");
              setPaypalPending(false);
            }
          }, delayMs);

          return () => clearTimeout(confirmTimeout);
        } else {
          console.log("=== No PayPal Return ===");
          console.log("paypalToken:", paypalToken, "paypalOrderId:", paypalOrderId, "paypalPlan:", paypalPlan);
        }

        const response = await axios.get("/api/subscriptions/current", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setSubscription(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch subscription:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [router]);

  if (paypalPending) {
    const handleRetryConfirm = async () => {
      const token = localStorage.getItem("accessToken");
      const paypalOrderId = localStorage.getItem("paypal_order_id");
      const paypalPlan = localStorage.getItem("paypal_plan");

      if (!token || !paypalOrderId || !paypalPlan) {
        setPaypalError("Missing payment information. Please try again.");
        setPaypalPending(false);
        return;
      }

      try {
        console.log("Manual retry: Attempting to confirm PayPal payment...");
        const confirmResponse = await axios.post(
          "/api/subscriptions/confirm-paypal",
          {
            orderId: paypalOrderId,
            plan: paypalPlan,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Confirm-PayPal response:", confirmResponse.data);

        if (confirmResponse.data.success) {
          // Track conversion in Google Ads
          trackSubscriptionConversion();

          localStorage.removeItem("paypal_order_id");
          localStorage.removeItem("paypal_plan");
          localStorage.removeItem("paypal_billing_cycle");
          window.history.replaceState({}, document.title, "/upgrade");
          setSubscription(confirmResponse.data.data.subscription);
          setPaypalPending(false);
          console.log("PayPal payment confirmed successfully");
          router.push("/settings?tab=membership&status=upgraded");
          return;
        } else {
          setPaypalError(confirmResponse.data.error?.message || "Payment confirmation failed");
        }
      } catch (err: any) {
        console.error("Retry failed:", err);
        setPaypalError(err.response?.data?.error?.message || "Failed to confirm payment");
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">
            Processing PayPal Payment
          </h1>
          <div className="mb-6">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            Confirming your payment with PayPal...
          </p>
          {paypalCountdown > 0 && (
            <p className="text-sm text-gray-500 mb-4">
              Retrying in {paypalCountdown} second{paypalCountdown !== 1 ? 's' : ''}...
            </p>
          )}
          {paypalError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
              <p className="mb-3">{paypalError}</p>
              <button
                onClick={handleRetryConfirm}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold"
              >
                Retry Confirmation
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Loading...
          </h1>
          <p className="text-gray-600">Please wait while we load your subscription details</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Subscription
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn't load your subscription details. Please try again.
          </p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <UpgradeMembership
      currentSubscription={subscription}
      onUpgradeSuccess={() => {
        router.push("/settings?tab=membership&status=upgraded");
      }}
    />
  );
}
