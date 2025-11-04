"use client";

import { useState, useEffect } from "react";
import { ChangePasswordForm } from "./ChangePasswordForm";
import axios from "axios";

interface UserSettingsProps {
  userName: string;
  userEmail: string;
  onClose: () => void;
}

interface Subscription {
  plan: "FREE" | "PRO" | "ENTERPRISE";
  projectLimit: number;
  taskLimit: number;
}

interface UserPreferences {
  enableAutoPrioritization: boolean;
  autoPrioritizationThresholdHours: number;
}

export function UserSettings({ userName, userEmail, onClose }: UserSettingsProps) {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences>({
    enableAutoPrioritization: true,
    autoPrioritizationThresholdHours: 48,
  });
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch subscription
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

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
      } finally {
        setLoadingSubscription(false);
      }
    };

    fetchSubscription();
  }, []);

  // Fetch user preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const response = await axios.get("/api/settings/preferences", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success && response.data.data) {
          setPreferences({
            enableAutoPrioritization: response.data.data.enableAutoPrioritization ?? true,
            autoPrioritizationThresholdHours: response.data.data.autoPrioritizationThresholdHours ?? 48,
          });
        }
      } catch (err) {
        console.error("Failed to fetch preferences:", err);
        // Use defaults if fetch fails
      } finally {
        setLoadingPreferences(false);
      }
    };

    fetchPreferences();
  }, []);

  // Save preferences
  const handleSavePreferences = async () => {
    setSavingPreferences(true);
    setSaveMessage(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await axios.post(
        "/api/settings/preferences",
        {
          enableAutoPrioritization: preferences.enableAutoPrioritization,
          autoPrioritizationThresholdHours: preferences.autoPrioritizationThresholdHours,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setSaveMessage({ type: "success", text: "Settings saved successfully!" });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: "error", text: "Failed to save settings" });
      }
    } catch (err) {
      console.error("Failed to save preferences:", err);
      setSaveMessage({ type: "error", text: "Error saving settings" });
    } finally {
      setSavingPreferences(false);
    }
  };

  if (showChangePassword) {
    return (
      <ChangePasswordForm
        onClose={() => setShowChangePassword(false)}
        onSuccess={() => setShowChangePassword(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* User Profile Section */}
        <div className="space-y-6">
          {/* User Info */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <p className="text-gray-900 font-medium">{userName || "Not set"}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <p className="text-gray-900 font-medium">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* Subscription/Membership Section */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Membership</h3>
            {loadingSubscription ? (
              <p className="text-gray-600 text-sm">Loading subscription...</p>
            ) : subscription ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">Current Plan</label>
                  <p className="text-gray-900 font-medium">{subscription.plan}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Projects</label>
                  <p className="text-gray-900 font-medium">
                    {subscription.projectLimit === 999999
                      ? "Unlimited"
                      : subscription.projectLimit}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Tasks</label>
                  <p className="text-gray-900 font-medium">
                    {subscription.taskLimit === 999999
                      ? "Unlimited"
                      : subscription.taskLimit}
                  </p>
                </div>
                <button
                  onClick={() => window.location.href = "/upgrade"}
                  className="w-full bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg transition font-medium text-left flex items-center justify-between mt-4"
                >
                  <span>Upgrade Plan</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">Unable to load subscription</p>
            )}
          </div>

          {/* Preferences Section */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Preferences</h3>
            {loadingPreferences ? (
              <p className="text-gray-600 text-sm">Loading preferences...</p>
            ) : (
              <div className="space-y-4">
                {/* Auto-Prioritization Toggle */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-900">Auto-Prioritization</label>
                    <p className="text-xs text-gray-600 mt-1">
                      Automatically move tasks to urgent quadrants when due date approaches
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.enableAutoPrioritization}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        enableAutoPrioritization: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mt-1"
                  />
                </div>

                {/* Threshold Setting */}
                {preferences.enableAutoPrioritization && (
                  <div>
                    <label htmlFor="threshold" className="text-sm font-medium text-gray-900">
                      Hours Until Due Date (threshold)
                    </label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        id="threshold"
                        type="number"
                        min="1"
                        max="168"
                        value={preferences.autoPrioritizationThresholdHours}
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            autoPrioritizationThresholdHours: parseInt(e.target.value) || 48,
                          })
                        }
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      />
                      <span className="text-sm text-gray-600">hours</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Default: 48 hours (2 days)
                    </p>
                  </div>
                )}

                {/* Save Button */}
                <div className="pt-4 border-t">
                  <button
                    onClick={handleSavePreferences}
                    disabled={savingPreferences}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition font-medium"
                  >
                    {savingPreferences ? "Saving..." : "Save Preferences"}
                  </button>
                  {saveMessage && (
                    <p
                      className={`text-sm mt-2 ${
                        saveMessage.type === "success"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {saveMessage.text}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Security Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg transition font-medium text-left flex items-center justify-between"
            >
              <span>Change Password</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Close Button */}
          <div className="pt-4 border-t">
            <button
              onClick={onClose}
              className="w-full bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
