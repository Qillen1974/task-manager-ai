"use client";

import { useState, useEffect } from "react";
import { Admin, getAdminToken } from "@/lib/adminAuth";
import { AdminUserManagement } from "./AdminUserManagement";
import { AdminStaffManagement } from "./AdminStaffManagement";

interface DatabaseUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  _count?: {
    projects: number;
    tasks: number;
  };
  subscription?: {
    id: string;
    plan: string;
    projectLimit: number;
    taskLimit: number;
  } | null;
}

interface SystemStats {
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  averageTasksPerUser: number;
  averageCompletionRate: number;
}

interface AdminDashboardProps {
  admin: Admin;
  onLogout: () => void;
}

type ActiveTab = "overview" | "users" | "staff" | "system-settings";

export function AdminDashboard({ admin, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [users, setUsers] = useState<DatabaseUser[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch users from database API
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = getAdminToken();
        console.log("Token from getAdminToken():", token ? `Token exists, length: ${token.length}, first 50 chars: ${token.substring(0, 50)}` : "Token is null");

        if (!token) {
          throw new Error("Admin token not found - user may not be logged in");
        }

        const authHeader = `Bearer ${token}`;
        console.log("Authorization header:", `Bearer ${authHeader.substring(7, 57)}...`);

        const response = await fetch("/api/admin/users", {
          headers: {
            "Authorization": authHeader,
          },
        });

        console.log("API Response status:", response.status);

        if (!response.ok) {
          const responseText = await response.text();
          console.error("API Error Response:", responseText);
          throw new Error(`Failed to fetch users: ${response.status} ${responseText}`);
        }

        const data = await response.json();
        console.log("API Response data:", data);

        const fetchedUsers = Array.isArray(data) ? data : data.data || [];

        setUsers(fetchedUsers);

        // Calculate system stats from database users
        const stats: SystemStats = {
          totalUsers: fetchedUsers.length,
          totalProjects: fetchedUsers.reduce((sum, u) => sum + (u._count?.projects || 0), 0),
          totalTasks: fetchedUsers.reduce((sum, u) => sum + (u._count?.tasks || 0), 0),
          completedTasks: 0, // Would need additional API call to get accurate count
          pendingTasks: 0,
          averageTasksPerUser: 0,
          averageCompletionRate: 0,
        };

        if (stats.totalUsers > 0) {
          stats.averageTasksPerUser = stats.totalTasks / stats.totalUsers;
        }

        setSystemStats(stats);
      } catch (err) {
        console.error("Error fetching users:", err);
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        console.error("Full error details:", { err, errorMessage });
        setError(errorMessage);
        // Set empty stats on error
        setSystemStats({
          totalUsers: 0,
          totalProjects: 0,
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          averageTasksPerUser: 0,
          averageCompletionRate: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM15.657 14.243a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM11 17a1 1 0 102 0v-1a1 1 0 10-2 0v1zM5.757 15.657a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM2 10a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.757 4.343a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">TaskQuadrant Admin</h1>
              <p className="text-sm text-gray-600">System Administration</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-white font-semibold">
                {admin.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{admin.name}</p>
                <p className="text-xs text-gray-600">{admin.role === "super_admin" ? "Super Admin" : "Admin"}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-lg hover:bg-gray-100 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            {[
              { id: "overview" as const, label: "Overview", icon: "📊" },
              { id: "users" as const, label: "Manage Users", icon: "👥" },
              { id: "staff" as const, label: "Admin Staff", icon: "🔐", restricted: "super_admin" },
              { id: "system-settings" as const, label: "System", icon: "⚙️", restricted: "super_admin" },
            ].map(
              (tab) =>
                (!tab.restricted || admin.role === tab.restricted) && (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                      activeTab === tab.id
                        ? "border-slate-700 text-slate-700"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                )
            )}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center animate-spin">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <p className="text-gray-600">Loading admin dashboard...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-900 font-medium">Error loading data</p>
            <p className="text-red-700 text-sm mt-2">{error}</p>
            <details className="mt-4 text-xs text-red-600">
              <summary className="cursor-pointer font-mono">Debug Info</summary>
              <pre className="mt-2 bg-red-100 p-2 rounded overflow-auto">{error}</pre>
            </details>
          </div>
        ) : activeTab === "overview" && systemStats ? (
          <div className="space-y-8">

            {users.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <p className="text-blue-900 font-medium">No users registered yet</p>
                <p className="text-blue-700 text-sm mt-2">Users will appear here once they register in the application.</p>
              </div>
            )}
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Total Users", value: systemStats.totalUsers, color: "blue", icon: "👥" },
                { label: "Total Projects", value: systemStats.totalProjects, color: "green", icon: "📁" },
                { label: "Total Tasks", value: systemStats.totalTasks, color: "purple", icon: "✓" },
                { label: "Completion Rate", value: `${systemStats.averageCompletionRate.toFixed(1)}%`, color: "orange", icon: "📈" },
              ].map((metric, idx) => (
                <div key={idx} className="bg-white rounded-lg border border-gray-200 p-6">
                  <p className="text-4xl font-bold text-gray-900 mb-2">{metric.value}</p>
                  <p className="text-sm text-gray-600">{metric.label}</p>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Users */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
                <div className="space-y-3">
                  {users
                    .slice()
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 5)
                    .map((user) => (
                      <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.email}</p>
                          <p className="text-xs text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Most Active Users */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Active Users</h3>
                <div className="space-y-3">
                  {users
                    .slice()
                    .sort((a, b) => {
                      const aCount = (a._count?.projects || 0) + (a._count?.tasks || 0);
                      const bCount = (b._count?.projects || 0) + (b._count?.tasks || 0);
                      return bCount - aCount;
                    })
                    .slice(0, 5)
                    .map((user) => (
                      <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.email}</p>
                          <p className="text-xs text-gray-500">{(user._count?.tasks || 0)} tasks</p>
                        </div>
                        <p className="text-sm font-semibold text-blue-600">{user._count?.projects || 0}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Detailed User Stats */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">User Statistics</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Projects</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Tasks</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user._count?.projects || 0}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user._count?.tasks || 0}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <>
            {activeTab === "users" && <AdminUserManagement users={users} onUsersChange={setUsers} />}

            {activeTab === "staff" && admin.role === "super_admin" && <AdminStaffManagement admin={admin} />}

            {activeTab === "system-settings" && admin.role === "super_admin" && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
                <p className="text-gray-600 mb-4">Advanced system configuration and maintenance options.</p>
                <div className="space-y-4">
                  <button className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded-lg transition">
                    🗑️ Clear All Data (Admin Use Only)
                  </button>
                  <button className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg transition">
                    💾 System Backup
                  </button>
                  <button className="w-full bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 px-4 py-2 rounded-lg transition">
                    ⚡ System Health Check
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {!isLoading && !error && !systemStats && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-900 font-medium">Dashboard Content Not Available</p>
            <p className="text-yellow-700 text-sm mt-2">The dashboard is still loading. If this message persists, please check the browser console for errors.</p>
          </div>
        )}
      </main>
    </div>
  );
}
