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
