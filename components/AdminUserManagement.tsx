"use client";

import { useState } from "react";
import { User } from "@/lib/auth";

interface SubscriptionInfo {
  id: string;
  plan: string;
  projectLimit: number;
  taskLimit: number;
}

interface DatabaseUser extends User {
  subscription?: SubscriptionInfo | null;
}

interface AdminUserManagementProps {
  users: DatabaseUser[];
  onUsersChange: (users: DatabaseUser[]) => void;
}

export function AdminUserManagement({ users, onUsersChange }: AdminUserManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<DatabaseUser | null>(null);
  const [upgradingUserId, setUpgradingUserId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"FREE" | "PRO" | "ENTERPRISE">("PRO");
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectUser = (user: DatabaseUser) => {
    setSelectedUser(user);
    // Clear messages when switching users
    setUpgradeError(null);
    setUpgradeSuccess(null);
    // Set the selected plan to the user's current plan
    setSelectedPlan((user.subscription?.plan || "PRO") as "FREE" | "PRO" | "ENTERPRISE");
  };

  const getPlanLimits = (plan: "FREE" | "PRO" | "ENTERPRISE") => {
    switch (plan) {
      case "FREE":
        return { projects: 3, tasks: 50 };
      case "PRO":
        return { projects: 100, tasks: 500 };
      case "ENTERPRISE":
        return { projects: 999999, tasks: 999999 };
    }
  };

  const handleUpgradePlan = async (userId: string, userEmail: string, newPlan: string) => {
    setUpgradeError(null);
    setUpgradeSuccess(null);
    setUpgradingUserId(userId);

    try {
      const response = await fetch("/api/admin/upgrade-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("taskmaster_admin_token")}`,
        },
        body: JSON.stringify({
          email: userEmail,
          plan: newPlan,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to upgrade subscription");
      }

      const data = await response.json();

      // Update the user with new subscription info
      const updatedUsers = users.map((u) =>
        u.id === userId
          ? {
              ...u,
              subscription: data.data?.subscription || {
                id: data.data?.subscriptionId || "",
                plan: newPlan,
                projectLimit: getPlanLimits(newPlan as "FREE" | "PRO" | "ENTERPRISE").projects,
                taskLimit: getPlanLimits(newPlan as "FREE" | "PRO" | "ENTERPRISE").tasks,
              },
            }
          : u
      );

      onUsersChange(updatedUsers);

      const updatedUser = updatedUsers.find((u) => u.id === userId);
      if (updatedUser) {
        setSelectedUser(updatedUser);
      }

      setUpgradeSuccess(`Successfully upgraded ${userEmail} to ${newPlan} plan`);
      setUpgradingUserId(null);
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : "An error occurred");
      setUpgradingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user and all their data?")) {
      try {
        const response = await fetch(`/api/admin/users?id=${userId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("taskmaster_admin_token")}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to delete user");
        }

        const updated = users.filter((u) => u.id !== userId);
        onUsersChange(updated);
        setSelectedUser(null);
        alert("User deleted successfully");
      } catch (err) {
        alert(`Error deleting user: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }
  };

  const handleToggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleSelectAllFiltered = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      // Deselect all
      setSelectedUserIds(new Set());
    } else {
      // Select all filtered
      const allIds = new Set(filteredUsers.map((u) => u.id));
      setSelectedUserIds(allIds);
    }
  };

  const handleBulkDeleteUsers = async () => {
    if (selectedUserIds.size === 0) {
      alert("Please select users to delete");
      return;
    }

    const count = selectedUserIds.size;
    if (
      window.confirm(
        `Are you sure you want to delete ${count} user(s) and all their data? This action cannot be undone.`
      )
    ) {
      try {
        let deletedCount = 0;
        let failedCount = 0;

        // Delete each user sequentially
        for (const userId of Array.from(selectedUserIds)) {
          try {
            const response = await fetch(`/api/admin/users?id=${userId}`, {
              method: "DELETE",
              headers: {
                "Authorization": `Bearer ${localStorage.getItem("taskmaster_admin_token")}`,
              },
            });

            if (!response.ok) {
              failedCount++;
            } else {
              deletedCount++;
            }
          } catch (err) {
            failedCount++;
          }
        }

        // Update the local state after all deletes are done
        const updated = users.filter((u) => !selectedUserIds.has(u.id));
        onUsersChange(updated);

        setSelectedUserIds(new Set());
        setSelectedUser(null);

        if (failedCount === 0) {
          alert(`Successfully deleted ${deletedCount} user(s)`);
        } else {
          alert(`Deleted ${deletedCount} user(s), but ${failedCount} deletion(s) failed`);
        }
      } catch (err) {
        alert(`Error deleting users: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }
  };

  const handleResetPassword = (userId: string) => {
    if (window.confirm("Reset password for this user to 'password123'?")) {
      const updated = users.map((u) =>
        u.id === userId ? { ...u, password: "password123" } : u
      );
      onUsersChange(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          {selectedUserIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-600">
                {selectedUserIds.size} selected
              </span>
              <button
                onClick={handleBulkDeleteUsers}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium text-sm"
              >
                Delete Selected
              </button>
            </div>
          )}
        </div>
        <input
          type="text"
          placeholder="Search users by email or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* User List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User List */}
        <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Users ({filteredUsers.length})</h3>
            {filteredUsers.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    filteredUsers.length > 0 &&
                    selectedUserIds.size === filteredUsers.length
                  }
                  onChange={handleSelectAllFiltered}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-xs text-gray-600">Select all</span>
              </label>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No users found</div>
            ) : (
              <div className="divide-y">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition ${
                      selectedUser?.id === user.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.has(user.id)}
                      onChange={() => handleToggleUserSelection(user.id)}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                    />
                    <button
                      onClick={() => handleSelectUser(user)}
                      className="flex-1 text-left"
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        ID: {user.id.substring(0, 8)}...
                      </p>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Details */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">User Details</h3>

                {/* User Info */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="text-gray-900 font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">User ID</label>
                    <p className="text-gray-900 font-medium font-mono text-xs">{selectedUser.id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Account Created</label>
                    <p className="text-gray-900">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Subscription Info */}
              {selectedUser.subscription && (
                <div className="border-t pt-6">
                  <h4 className="font-semibold text-gray-900 mb-4">💳 Subscription Plan</h4>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Plan:</span>
                      <span className="text-lg font-bold text-blue-600">{selectedUser.subscription.plan}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Project Limit:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedUser.subscription.projectLimit === 999999 ? "Unlimited" : selectedUser.subscription.projectLimit}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Task Limit:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedUser.subscription.taskLimit === 999999 ? "Unlimited" : selectedUser.subscription.taskLimit}</span>
                    </div>
                  </div>

                  {/* Plan Change UI */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Change Plan</label>
                    <div className="space-y-2">
                      {["FREE", "PRO", "ENTERPRISE"].map((plan) => (
                        <label key={plan} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                          <input
                            type="radio"
                            name={`plan-${selectedUser.id}`}
                            value={plan}
                            checked={selectedPlan === plan}
                            onChange={() => setSelectedPlan(plan as "FREE" | "PRO" | "ENTERPRISE")}
                            disabled={upgradingUserId === selectedUser.id}
                            className="mr-3"
                          />
                          <span className="font-medium text-gray-900">{plan}</span>
                        </label>
                      ))}
                    </div>

                    {upgradeError && (
                      <div className="mt-3 p-2 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
                        {upgradeError}
                      </div>
                    )}

                    {upgradeSuccess && (
                      <div className="mt-3 p-2 bg-green-100 border border-green-300 text-green-700 rounded text-sm">
                        {upgradeSuccess}
                      </div>
                    )}

                    <button
                      onClick={() => handleUpgradePlan(selectedUser.id, selectedUser.email, selectedPlan)}
                      disabled={upgradingUserId === selectedUser.id || selectedPlan === selectedUser.subscription.plan}
                      className="w-full mt-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition font-medium"
                    >
                      {upgradingUserId === selectedUser.id ? "Updating..." : "Update Plan"}
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t pt-6 space-y-2">
                <button
                  onClick={() => handleResetPassword(selectedUser.id)}
                  className="w-full bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-lg transition font-medium"
                >
                  🔑 Reset Password
                </button>
                <button
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded-lg transition font-medium"
                >
                  🗑️ Delete User & Data
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
              <p className="text-gray-600">Select a user to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
