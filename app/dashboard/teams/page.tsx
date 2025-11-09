"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { useApi } from "@/lib/useApi";
import { AuthPage } from "@/components/AuthPage";
import { Users, Plus, MoreVertical, Settings } from "lucide-react";
import Link from "next/link";

interface Team {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  ownerId: string;
  createdAt: string;
  userRole: string;
  memberCount: number;
}

interface Subscription {
  plan: "FREE" | "PRO" | "ENTERPRISE";
}

export default function TeamsPage() {
  const api = useApi();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const [authRes, subRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/subscriptions/current").catch(() => ({ data: { plan: "FREE" } })),
      ]);

      if (authRes.data) {
        setAuthenticated(true);
        setSubscription(subRes.data);
        loadTeams();
      }
    } catch (err) {
      setAuthenticated(false);
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await api.get("/teams");
      if (response.data) {
        setTeams(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      setError("Team name is required");
      return;
    }

    try {
      setCreatingTeam(true);
      const response = await api.post("/teams", {
        name: newTeamName,
        description: newTeamDescription,
      });

      if (response.data) {
        setTeams([response.data, ...teams]);
        setNewTeamName("");
        setNewTeamDescription("");
        setShowCreateModal(false);
        setError(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to create team");
    } finally {
      setCreatingTeam(false);
    }
  };

  if (!authenticated) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
            <p className="mt-2 text-gray-600">Collaborate with your team members</p>
            {subscription && subscription.plan !== "ENTERPRISE" && (
              <p className="mt-2 text-sm text-blue-600">
                💡 Teams are an ENTERPRISE feature. <Link href="/dashboard/settings" className="font-semibold hover:underline">Upgrade now</Link>
              </p>
            )}
          </div>
          <button
            onClick={() => {
              if (subscription?.plan !== "ENTERPRISE") {
                setError("Teams are an ENTERPRISE feature. Please upgrade your subscription.");
                return;
              }
              setShowCreateModal(true);
            }}
            disabled={subscription?.plan !== "ENTERPRISE"}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              subscription?.plan === "ENTERPRISE"
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            <Plus className="w-5 h-5" />
            Create Team
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <span className="text-red-800">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-700 ml-auto font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Create Team Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Create New Team</h2>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g., Product Team"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={creatingTeam}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    placeholder="What is this team for?"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={creatingTeam}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    disabled={creatingTeam}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    disabled={creatingTeam}
                  >
                    {creatingTeam ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Loading teams...</div>
          </div>
        )}

        {/* Teams Grid */}
        {!loading && teams.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Link key={team.id} href={`/dashboard/teams/${team.id}`}>
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer border border-gray-200 hover:border-blue-300">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                      <p className="text-sm text-gray-500">@{team.slug}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {team.userRole}
                    </span>
                  </div>

                  {team.description && (
                    <p className="text-sm text-gray-600 mb-4">{team.description}</p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{team.memberCount} member{team.memberCount !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(team.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && teams.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first team to start collaborating with others
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              Create Your First Team
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
