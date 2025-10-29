"use client";

import { useState } from "react";
import { ChangePasswordForm } from "./ChangePasswordForm";

interface UserSettingsProps {
  userName: string;
  userEmail: string;
  onClose: () => void;
}

export function UserSettings({ userName, userEmail, onClose }: UserSettingsProps) {
  const [showChangePassword, setShowChangePassword] = useState(false);

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
