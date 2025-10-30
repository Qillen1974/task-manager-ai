"use client";

import { useState } from "react";

interface AdminPanelProps {
  onUpgradeUser: (email: string) => Promise<any>;
}

export function AdminPanel({ onUpgradeUser }: AdminPanelProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage({ type: "error", text: "Please enter an email address" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await onUpgradeUser(email);

      if (response.success) {
        setMessage({
          type: "success",
          text: `✓ Successfully upgraded ${email} to unlimited plan!`
        });
        setEmail("");
      } else {
        setMessage({
          type: "error",
          text: `Error: ${response.error?.message || "Failed to upgrade user"}`
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while upgrading the user"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-md">
      <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
      <p className="text-gray-600 text-sm mb-4">Upgrade user accounts to unlimited plan</p>

      <form onSubmit={handleUpgrade} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            User Email *
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            disabled={loading}
          />
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {loading ? "Upgrading..." : "Upgrade to Unlimited"}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">Unlimited Plan Benefits:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>✓ Unlimited projects</li>
          <li>✓ Unlimited tasks</li>
          <li>✓ Full feature access</li>
        </ul>
      </div>
    </div>
  );
}
