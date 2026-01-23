"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, ArrowLeft, Save, RotateCcw } from "lucide-react";
import { NotificationPreference } from "@/types/notifications";

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/notifications/preferences");
      if (!response.ok) {
        throw new Error("Failed to load preferences");
      }
      const data = await response.json();
      setPreferences(data.data);
    } catch (err) {
      console.error("Failed to load notification preferences:", err);
      setError("Failed to load notification preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (field: keyof NotificationPreference) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      [field]: !preferences[field],
    });
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailTaskAssignments: preferences.emailTaskAssignments,
          emailTeamInvitations: preferences.emailTeamInvitations,
          emailDocumentUploads: preferences.emailDocumentUploads,
          emailStickyNotes: preferences.emailStickyNotes,
          emailTaskCompletions: preferences.emailTaskCompletions,
          inAppTaskAssignments: preferences.inAppTaskAssignments,
          inAppTeamInvitations: preferences.inAppTeamInvitations,
          inAppDocumentUploads: preferences.inAppDocumentUploads,
          inAppStickyNotes: preferences.inAppStickyNotes,
          inAppTaskCompletions: preferences.inAppTaskCompletions,
          inAppTaskStartDate: preferences.inAppTaskStartDate,
          notificationsMuted: preferences.notificationsMuted,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      const data = await response.json();
      setPreferences(data.data);
      setSuccessMessage("Preferences saved successfully");
    } catch (err) {
      console.error("Failed to save notification preferences:", err);
      setError("Failed to save preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch("/api/notifications/preferences", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to reset preferences");
      }

      const data = await response.json();
      setPreferences(data.data);
      setSuccessMessage("Preferences reset to defaults");
    } catch (err) {
      console.error("Failed to reset notification preferences:", err);
      setError("Failed to reset preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600">Loading preferences...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-4"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <Bell size={32} className="text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Manage how you receive notifications for tasks, team activities, and more.
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {successMessage}
          </div>
        )}

        {preferences && (
          <>
            {/* Mute All Toggle */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Mute All Notifications</h3>
                  <p className="text-sm text-gray-600">
                    Temporarily disable all notifications
                  </p>
                </div>
                <ToggleSwitch
                  enabled={preferences.notificationsMuted}
                  onChange={() => handleToggle("notificationsMuted")}
                />
              </div>
            </div>

            {/* In-App Notifications */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">In-App Notifications</h2>
              <p className="text-sm text-gray-600 mb-6">
                Choose which notifications appear in your notification center.
              </p>

              <div className="space-y-4">
                <PreferenceRow
                  label="Task assignments"
                  description="When you're assigned to a task"
                  enabled={preferences.inAppTaskAssignments}
                  onChange={() => handleToggle("inAppTaskAssignments")}
                />
                <PreferenceRow
                  label="Team invitations"
                  description="When you're invited to join a team"
                  enabled={preferences.inAppTeamInvitations}
                  onChange={() => handleToggle("inAppTeamInvitations")}
                />
                <PreferenceRow
                  label="Document uploads"
                  description="When documents are uploaded to your team workspace"
                  enabled={preferences.inAppDocumentUploads}
                  onChange={() => handleToggle("inAppDocumentUploads")}
                />
                <PreferenceRow
                  label="Sticky notes"
                  description="When team members send you sticky notes"
                  enabled={preferences.inAppStickyNotes}
                  onChange={() => handleToggle("inAppStickyNotes")}
                />
                <PreferenceRow
                  label="Task completions"
                  description="When tasks you're assigned to are completed"
                  enabled={preferences.inAppTaskCompletions}
                  onChange={() => handleToggle("inAppTaskCompletions")}
                />
                <PreferenceRow
                  label="Task start date reminders"
                  description="Get notified at 9 AM when a task's start date arrives"
                  enabled={preferences.inAppTaskStartDate}
                  onChange={() => handleToggle("inAppTaskStartDate")}
                />
              </div>
            </div>

            {/* Email Notifications */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Email Notifications</h2>
              <p className="text-sm text-gray-600 mb-6">
                Choose which notifications are also sent to your email.
              </p>

              <div className="space-y-4">
                <PreferenceRow
                  label="Task assignments"
                  description="Email when you're assigned to a task"
                  enabled={preferences.emailTaskAssignments}
                  onChange={() => handleToggle("emailTaskAssignments")}
                />
                <PreferenceRow
                  label="Team invitations"
                  description="Email when you're invited to join a team"
                  enabled={preferences.emailTeamInvitations}
                  onChange={() => handleToggle("emailTeamInvitations")}
                />
                <PreferenceRow
                  label="Document uploads"
                  description="Email when documents are uploaded"
                  enabled={preferences.emailDocumentUploads}
                  onChange={() => handleToggle("emailDocumentUploads")}
                />
                <PreferenceRow
                  label="Sticky notes"
                  description="Email when you receive sticky notes"
                  enabled={preferences.emailStickyNotes}
                  onChange={() => handleToggle("emailStickyNotes")}
                />
                <PreferenceRow
                  label="Task completions"
                  description="Email when tasks are completed"
                  enabled={preferences.emailTaskCompletions}
                  onChange={() => handleToggle("emailTaskCompletions")}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="px-4 py-2 flex items-center gap-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                <RotateCcw size={18} />
                Reset to Defaults
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 flex items-center gap-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Save size={18} />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Toggle switch component
 */
function ToggleSwitch({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        enabled ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

/**
 * Preference row component
 */
function PreferenceRow({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} />
    </div>
  );
}
