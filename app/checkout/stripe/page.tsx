"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import { trackSubscriptionConversion } from "@/lib/gtagUtils";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

function CheckoutForm({
  clientSecret,
  plan,
}: {
  clientSecret: string;
  plan: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe is not loaded. Please refresh the page.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError("Card element not found");
        return;
      }

      // Use SetupIntent to create a reusable payment method for the subscription
      const { setupIntent, error: confirmError } =
        await stripe.confirmCardSetup(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });

      if (confirmError) {
        setError(confirmError.message || "Card setup failed");
        setLoading(false);
        return;
      }

      if (setupIntent?.status === "succeeded") {
        // Card setup successful, now create subscription via backend
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("Authentication token not found");
          setLoading(false);
          return;
        }

        // Get payment method ID from setupIntent
        const paymentMethodId = setupIntent.payment_method;
        if (!paymentMethodId) {
          setError("Payment method not attached to setup intent");
          setLoading(false);
          return;
        }

        console.log("Setup Intent succeeded:", {
          setupIntentId: setupIntent.id,
          paymentMethodId,
          plan,
        });

        const confirmResponse = await axios.post(
          "/api/subscriptions/confirm-stripe",
          {
            setupIntentId: setupIntent.id,
            paymentMethodId: paymentMethodId,
            plan,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (confirmResponse.data.success) {
          // Track conversion in Google Ads
          trackSubscriptionConversion();

          setSuccess(true);
          // Clear sessionStorage
          sessionStorage.removeItem("stripe_plan");
          sessionStorage.removeItem("stripe_client_secret");
          sessionStorage.removeItem("stripe_billing_cycle");
          // Redirect to home page after 2 seconds
          setTimeout(() => {
            router.push("/");
          }, 2000);
        } else {
          setError(
            confirmResponse.data.error?.message ||
              "Failed to create subscription after card setup"
          );
        }
      } else if (setupIntent?.status === "requires_action") {
        setError("Card setup requires additional action. Please complete the verification.");
      } else {
        setError(`Card setup failed with status: ${setupIntent?.status}`);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          "An error occurred during payment"
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="text-green-600 text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h2>
        <p className="text-gray-600 mb-4">
          Your subscription has been upgraded to {plan} plan.
        </p>
        <p className="text-gray-500">Redirecting to settings...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Card Details
        </label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": {
                  color: "#aab7c4",
                },
              },
              invalid: {
                color: "#fa755a",
              },
            },
          }}
          className="p-4 border border-gray-300 rounded"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
      >
        {loading ? "Processing..." : `Pay for ${plan} Plan`}
      </button>
    </form>
  );
}

function StripeCheckoutContent() {
  const searchParams = useSearchParams();
  const clientSecret = searchParams.get("clientSecret");
  const plan = searchParams.get("plan");

  if (!clientSecret || !plan) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-md mx-auto bg-white rounded-lg p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900">Invalid Request</h1>
          <p className="text-gray-600 mt-2">
            Missing required payment information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Complete Payment
        </h1>
        <p className="text-gray-600 mb-6">
          Upgrade your subscription to {plan} plan
        </p>

        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm clientSecret={clientSecret} plan={plan} />
        </Elements>
      </div>
    </div>
  );
}

export default function StripCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
          <div className="text-center">Loading payment details...</div>
        </div>
      }
    >
      <StripeCheckoutContent />
    </Suspense>
  );
}
