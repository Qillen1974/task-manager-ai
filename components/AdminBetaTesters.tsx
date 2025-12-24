"use client";

import { useState, useEffect } from "react";
import { getAdminToken } from "@/lib/adminAuth";

interface BetaTester {
  id: string;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  isBetaTester: boolean;
  betaJoinedAt: string | null;
  mobileUnlocked: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  projectCount: number;
  totalTaskCount: number;
  completedTaskCount: number;
  recurringTaskCount: number;
}

interface Summary {
  total: number;
  unlocked: number;
  pendingUnlock: number;
}

export function AdminBetaTesters() {
  const [betaTesters, setBetaTesters] = useState<BetaTester[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "unlocked" | "pending">("all");

  const fetchBetaTesters = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = getAdminToken();
      if (!token) {
        throw new Error("Admin token not found");
      }

      const response = await fetch("/api/admin/beta-testers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch beta testers: ${response.status}`);
      }

      const data = await response.json();
      setBetaTesters(data.data.betaTesters);
      setSummary(data.data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBetaTesters();
  }, []);

  const handleSelectAll = () => {
    const filteredTesters = getFilteredTesters();
    if (selectedIds.size === filteredTesters.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTesters.map((t) => t.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleGrantUnlock = async () => {
    if (selectedIds.size === 0) return;

    setIsProcessing(true);
    setSuccessMessage(null);

    try {
      const token = getAdminToken();
      if (!token) {
        throw new Error("Admin token not found");
      }

      const response = await fetch("/api/admin/beta-testers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds: Array.from(selectedIds),
          action: "grant",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to grant unlock: ${response.status}`);
      }

      const data = await response.json();
      setSuccessMessage(data.data.message);
      setSelectedIds(new Set());
      await fetchBetaTesters();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevokeUnlock = async () => {
    if (selectedIds.size === 0) return;

    setIsProcessing(true);
    setSuccessMessage(null);

    try {
      const token = getAdminToken();
      if (!token) {
        throw new Error("Admin token not found");
      }

      const response = await fetch("/api/admin/beta-testers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds: Array.from(selectedIds),
          action: "revoke",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to revoke unlock: ${response.status}`);
      }

      const data = await response.json();
      setSuccessMessage(data.data.message);
      setSelectedIds(new Set());
      await fetchBetaTesters();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const getFilteredTesters = () => {
    switch (filterStatus) {
      case "unlocked":
        return betaTesters.filter((t) => t.mobileUnlocked);
      case "pending":
        return betaTesters.filter((t) => !t.mobileUnlocked);
      default:
        return betaTesters;
    }
  };

  const filteredTesters = getFilteredTesters();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 bg-purple-600 rounded-lg mx-auto mb-4 flex items-center justify-center animate-spin">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-gray-600">Loading beta testers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-900 font-medium">Error loading beta testers</p>
        <p className="text-red-700 text-sm mt-2">{error}</p>
        <button
          onClick={fetchBetaTesters}
          className="mt-4 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🧪</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{summary.total}</p>
                <p className="text-sm text-gray-600">Total Beta Testers</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔓</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{summary.unlocked}</p>
                <p className="text-sm text-gray-600">Unlocked</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-yellow-600">{summary.pendingUnlock}</p>
                <p className="text-sm text-gray-600">Pending Unlock</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-green-700">{successMessage}</p>
          <button onClick={() => setSuccessMessage(null)} className="text-green-700 hover:text-green-900">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Actions Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Filter:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as "all" | "unlocked" | "pending")}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All ({betaTesters.length})</option>
                <option value="unlocked">Unlocked ({betaTesters.filter((t) => t.mobileUnlocked).length})</option>
                <option value="pending">Pending ({betaTesters.filter((t) => !t.mobileUnlocked).length})</option>
              </select>
            </div>
            <span className="text-sm text-gray-500">
              {selectedIds.size} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGrantUnlock}
              disabled={selectedIds.size === 0 || isProcessing}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              {isProcessing ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <span>🔓</span>
              )}
              Grant Unlock
            </button>
            <button
              onClick={handleRevokeUnlock}
              disabled={selectedIds.size === 0 || isProcessing}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <span>🔒</span>
              Revoke Unlock
            </button>
          </div>
        </div>
      </div>

      {/* Beta Testers Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredTesters.length && filteredTesters.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Beta Joined</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Projects</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Tasks</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Completed</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTesters.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    {betaTesters.length === 0 ? (
                      <div>
                        <p className="text-lg font-medium">No beta testers yet</p>
                        <p className="text-sm mt-1">Beta testers will appear here once they log in to the mobile app during beta mode.</p>
                      </div>
                    ) : (
                      <p>No testers match the current filter</p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTesters.map((tester) => (
                  <tr key={tester.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(tester.id)}
                        onChange={() => handleToggleSelect(tester.id)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tester.name}</p>
                        <p className="text-xs text-gray-500">{tester.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {tester.mobileUnlocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          🔓 Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⏳ Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {tester.betaJoinedAt
                        ? new Date(tester.betaJoinedAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{tester.projectCount}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{tester.totalTaskCount}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      <span className={tester.completedTaskCount > 0 ? "text-green-600 font-medium" : ""}>
                        {tester.completedTaskCount}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {tester.lastLoginAt
                        ? new Date(tester.lastLoginAt).toLocaleDateString()
                        : "Never"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-medium text-purple-900 mb-2">How to use this page</h4>
        <ul className="text-sm text-purple-700 space-y-1">
          <li>1. Select beta testers you want to reward using the checkboxes</li>
          <li>2. Click "Grant Unlock" to give them permanent mobile premium access</li>
          <li>3. Use filters to find active testers (more tasks/projects = more engaged)</li>
          <li>4. You can also revoke access if needed</li>
        </ul>
      </div>
    </div>
  );
}
