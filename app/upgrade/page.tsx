"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import UpgradeMembership from "@/components/UpgradeMembership";

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
          // User has returned from PayPal - try to confirm payment
          try {
            console.log("=== PayPal Return Detected ===");
            console.log("PayPal Token:", paypalToken);
            console.log("Calling confirm-paypal endpoint with:", { orderId: paypalOrderId, plan: paypalPlan });
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
              // Clear localStorage after successful confirmation
              localStorage.removeItem("paypal_order_id");
              localStorage.removeItem("paypal_plan");
              localStorage.removeItem("paypal_billing_cycle");

              // Clear URL query parameter
              window.history.replaceState({}, document.title, "/upgrade");

              // Update subscription
              setSubscription(confirmResponse.data.data.subscription);
              setLoading(false);
              console.log("PayPal payment confirmed successfully");
              // Redirect to settings with success message
              router.push("/settings?tab=membership&status=upgraded");
              return;
            } else {
              console.error("Confirm-PayPal response not successful:", confirmResponse.data.error);
              // Payment not yet approved or other issue - clear query param and show current state
              window.history.replaceState({}, document.title, "/upgrade");

              // Only clear localStorage if explicitly failed, not if pending
              if (confirmResponse.data.error?.code !== "PAYMENT_PENDING_APPROVAL") {
                localStorage.removeItem("paypal_order_id");
                localStorage.removeItem("paypal_plan");
                localStorage.removeItem("paypal_billing_cycle");
              }
            }
          } catch (err: any) {
            console.error("Failed to confirm PayPal payment:", err);
            console.error("Error response data:", JSON.stringify(err.response?.data, null, 2));
            console.error("Error status:", err.response?.status);

            // Clear URL query parameter
            window.history.replaceState({}, document.title, "/upgrade");

            // Only clear localStorage on network/other errors, not on validation errors
            const errorCode = err.response?.data?.error?.code;
            if (errorCode !== "PAYMENT_PENDING_APPROVAL") {
              localStorage.removeItem("paypal_order_id");
              localStorage.removeItem("paypal_plan");
              localStorage.removeItem("paypal_billing_cycle");
            }
            // Continue to fetch current subscription on error
          }
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
