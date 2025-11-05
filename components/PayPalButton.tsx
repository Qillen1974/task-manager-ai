"use client";

import { useEffect, useRef } from "react";
import axios from "axios";

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalButtonProps {
  planName: string;
  amount: number;
  onSuccess: (orderDetails: any) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

export default function PayPalButton({
  planName,
  amount,
  onSuccess,
  onError,
  isLoading = false,
}: PayPalButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRenderedRef = useRef(false);

  useEffect(() => {
    // Load PayPal SDK if not already loaded
    if (!window.paypal) {
      const script = document.createElement("script");
      // Use live mode by default (no sandbox parameter) - SDK defaults to production
      script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD&intent=capture`;
      script.async = true;
      script.onload = () => {
        // Wait a moment for PayPal to fully initialize
        setTimeout(() => {
          if (window.paypal) {
            renderButton();
          } else {
            onError("PayPal SDK failed to initialize");
          }
        }, 100);
      };
      script.onerror = () => {
        onError("Failed to load PayPal SDK");
      };
      document.body.appendChild(script);
    } else {
      renderButton();
    }

    return () => {
      // Cleanup: clear button container
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      buttonRenderedRef.current = false;
    };
  }, [onError]);

  const renderButton = () => {
    if (buttonRenderedRef.current || !containerRef.current) return;
    if (!window.paypal) return;

    buttonRenderedRef.current = true;

    window.paypal
      .Buttons({
        createOrder: async (data: any, actions: any) => {
          try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
              throw new Error("Please log in to continue");
            }

            // Create PayPal order
            const response = await axios.post(
              "/api/subscriptions/upgrade-paypal",
              {
                plan: planName,
                amount: amount.toFixed(2),
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!response.data.success) {
              throw new Error(response.data.error?.message || "Failed to create order");
            }

            console.log("PayPal order created:", response.data.data.orderId);
            return response.data.data.orderId;
          } catch (error: any) {
            console.error("Order creation error:", error);
            onError(error.message || "Failed to create PayPal order");
            throw error;
          }
        },

        onApprove: async (data: any, actions: any) => {
          try {
            console.log("Payment approved by user, order ID:", data.orderID);

            const token = localStorage.getItem("accessToken");
            if (!token) {
              throw new Error("Please log in to continue");
            }

            // Confirm and capture the payment
            const response = await axios.post(
              "/api/subscriptions/confirm-paypal",
              {
                orderId: data.orderID,
                plan: planName,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (response.data.success) {
              console.log("Payment captured successfully");
              onSuccess(response.data.data);
            } else {
              throw new Error(response.data.error?.message || "Failed to capture payment");
            }
          } catch (error: any) {
            console.error("Payment approval error:", error);
            onError(error.message || "Failed to complete payment");
          }
        },

        onError: (error: any) => {
          console.error("PayPal error:", error);
          onError("An error occurred with PayPal. Please try again.");
        },

        onCancel: () => {
          console.log("User cancelled the payment");
          onError("Payment cancelled. Please try again.");
        },
      })
      .render(containerRef.current);
  };

  return (
    <div
      ref={containerRef}
      className={`w-full ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
    />
  );
}
