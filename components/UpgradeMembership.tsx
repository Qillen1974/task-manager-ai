"use client";

import React, { useState } from "react";
import axios from "axios";
import { Check } from "lucide-react";

interface Subscription {
  id: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  projectLimit: number;
  taskLimit: number;
}

interface UpgradeMembershipProps {
  currentSubscription: Subscription;
  onUpgradeSuccess?: () => void;
}

interface PlanDetails {
  name: string;
  price: number;
  description: string;
  features: string[];
  projectLimit: number;
  taskLimit: number;
}

const PLAN_DETAILS: Record<string, PlanDetails> = {
  FREE: {
    name: "Free",
    price: 0,
    description: "Perfect for getting started",
    features: [
      "3 Projects",
      "50 Tasks",
      "Basic features",
      "Email support",
    ],
    projectLimit: 3,
    taskLimit: 50,
  },
  PRO: {
    name: "Pro",
    price: 29.99,
    description: "For growing teams",
    features: [
      "100 Projects",
      "500 Tasks",
      "Advanced analytics",
      "Priority support",
      "Subproject support",
    ],
    projectLimit: 100,
    taskLimit: 500,
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 99.99,
    description: "For large organizations",
    features: [
      "Unlimited Projects",
      "Unlimited Tasks",
      "Unlimited subproject levels",
      "Advanced security",
      "Dedicated support",
      "API access",
    ],
    projectLimit: 999999,
    taskLimit: 999999,
  },
};

export default function UpgradeMembership({
  currentSubscription,
  onUpgradeSuccess,
}: UpgradeMembershipProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">(
    "stripe"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Calculate price based on billing cycle
  const getPrice = (basePriceMonthly: number) => {
    if (billingCycle === "annual") {
      // Apply discount: PRO gets 20% discount, ENTERPRISE gets 17% discount
      const discountPercent = selectedPlan === "PRO" ? 20 : selectedPlan === "ENTERPRISE" ? 17 : 0;
      const annualPrice = basePriceMonthly * 12;
      const discount = annualPrice * (discountPercent / 100);
      return annualPrice - discount;
    }
    return basePriceMonthly;
  };

  const handleUpgradeClick = (plan: string) => {
    if (plan === currentSubscription.plan) {
      setError("You are already on this plan");
      return;
    }
    setSelectedPlan(plan);
    setShowPaymentForm(true);
    setError(null);
  };

  const handleStripePayment = async () => {
    if (!selectedPlan) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Please log in to upgrade");
        return;
      }

      const planPrice = PLAN_DETAILS[selectedPlan].price;
      const finalPrice = getPrice(planPrice);
      const amountInCents = Math.round(finalPrice * 100);

      // Create payment intent
      const response = await axios.post(
        "/api/subscriptions/upgrade-stripe",
        {
          plan: selectedPlan,
          amount: amountInCents,
          billingCycle: billingCycle,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Store the payment intent ID for confirmation
        sessionStorage.setItem(
          "stripe_payment_intent_id",
          response.data.data.paymentIntentId
        );
        sessionStorage.setItem("stripe_plan", selectedPlan);
        sessionStorage.setItem("stripe_client_secret", response.data.data.clientSecret);
        sessionStorage.setItem("stripe_billing_cycle", billingCycle);

        // Redirect to Stripe payment form
        window.location.href = `/checkout/stripe?clientSecret=${response.data.data.clientSecret}&plan=${selectedPlan}&billingCycle=${billingCycle}`;
      } else {
        setError(
          response.data.error?.message || "Failed to create payment intent"
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Payment initialization failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalPayment = async () => {
    if (!selectedPlan) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Please log in to upgrade");
        return;
      }

      const planPrice = PLAN_DETAILS[selectedPlan].price;
      const finalPrice = getPrice(planPrice);
      const amountStr = finalPrice.toFixed(2);

      // Create PayPal order
      const response = await axios.post(
        "/api/subscriptions/upgrade-paypal",
        {
          plan: selectedPlan,
          amount: amountStr,
          billingCycle: billingCycle,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Store the order ID for confirmation
        sessionStorage.setItem("paypal_order_id", response.data.data.orderId);
        sessionStorage.setItem("paypal_plan", selectedPlan);
        sessionStorage.setItem("paypal_billing_cycle", billingCycle);

        // Redirect to PayPal approval URL
        if (response.data.data.approvalLink) {
          window.location.href = response.data.data.approvalLink;
        } else {
          setError("Failed to get PayPal approval link");
        }
      } else {
        setError(response.data.error?.message || "Failed to create PayPal order");
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "PayPal order creation failed");
    } finally {
      setLoading(false);
    }
  };

  const planOrder = ["FREE", "PRO", "ENTERPRISE"];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Upgrade to unlock more projects, tasks, and features
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                billingCycle === "monthly"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-3 rounded-lg font-semibold transition relative ${
                billingCycle === "annual"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400"
              }`}
            >
              Annual Billing
              <span className={`ml-2 inline-block px-2 py-1 text-xs font-semibold rounded ${
                billingCycle === "annual"
                  ? "bg-blue-500 text-blue-100"
                  : "bg-green-100 text-green-700"
              }`}>
                Save up to 20%
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {planOrder.map((planKey) => {
            const plan = PLAN_DETAILS[planKey];
            const isCurrentPlan = planKey === currentSubscription.plan;
            const isSelected = planKey === selectedPlan;

            return (
              <div
                key={planKey}
                className={`rounded-lg border-2 transition-all cursor-pointer ${
                  isCurrentPlan
                    ? "border-blue-500 bg-blue-50"
                    : isSelected
                      ? "border-blue-400 bg-white shadow-lg"
                      : "border-gray-200 bg-white hover:border-gray-300"
                }`}
                onClick={() => handleUpgradeClick(planKey)}
              >
                <div className="p-8">
                  {isCurrentPlan && (
                    <div className="mb-4 inline-block bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Current Plan
                    </div>
                  )}

                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      ${getPrice(plan.price).toFixed(2)}
                    </span>
                    <span className="text-gray-600 ml-2">
                      {billingCycle === "annual" ? "/year" : "/month"}
                    </span>
                    {billingCycle === "annual" && plan.price > 0 && (
                      <div className="text-sm text-green-600 mt-2">
                        {planKey === "PRO" && "Save $14.40/year"}
                        {planKey === "ENTERPRISE" && "Save $20.04/year"}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleUpgradeClick(planKey)}
                    disabled={isCurrentPlan}
                    className={`w-full py-3 rounded-lg font-semibold mb-6 transition-colors ${
                      isCurrentPlan
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    {isCurrentPlan ? "Current Plan" : "Upgrade"}
                  </button>

                  <div className="space-y-4">
                    <div className="text-sm font-semibold text-gray-900 mb-3">
                      Limits:
                    </div>
                    <div className="flex items-center text-gray-700">
                      <span className="font-semibold">{plan.projectLimit}</span>
                      <span className="ml-2">
                        Project{plan.projectLimit !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <span className="font-semibold">{plan.taskLimit}</span>
                      <span className="ml-2">
                        Task{plan.taskLimit !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="pt-4 border-t border-gray-200 mt-4">
                      <div className="text-sm font-semibold text-gray-900 mb-3">
                        Features:
                      </div>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-center text-gray-700 text-sm"
                          >
                            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showPaymentForm && selectedPlan && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Complete Your Upgrade
            </h2>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                Upgrading from <strong>{currentSubscription.plan}</strong> to{" "}
                <strong>{selectedPlan}</strong>
              </p>
              <p className="text-gray-700 mt-1 text-sm">
                Billing cycle: <strong>{billingCycle === "annual" ? "Annual" : "Monthly"}</strong>
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${getPrice(PLAN_DETAILS[selectedPlan].price).toFixed(2)}/{billingCycle === "annual" ? "year" : "month"}
              </p>
              {billingCycle === "annual" && selectedPlan !== "FREE" && (
                <p className="text-sm text-green-600 mt-2">
                  {selectedPlan === "PRO" && "You save $14.40 per year!"}
                  {selectedPlan === "ENTERPRISE" && "You save $20.04 per year!"}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-4">
                Choose Payment Method
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod("stripe")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === "stripe"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-lg font-semibold text-gray-900">
                    Credit Card
                  </div>
                  <div className="text-sm text-gray-600">Powered by Stripe</div>
                </button>

                <button
                  onClick={() => setPaymentMethod("paypal")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === "paypal"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-lg font-semibold text-gray-900">
                    PayPal
                  </div>
                  <div className="text-sm text-gray-600">Secure PayPal payment</div>
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowPaymentForm(false);
                  setSelectedPlan(null);
                }}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={
                  paymentMethod === "stripe"
                    ? handleStripePayment
                    : handlePayPalPayment
                }
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400"
              >
                {loading ? "Processing..." : `Pay with ${paymentMethod === "stripe" ? "Stripe" : "PayPal"}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
