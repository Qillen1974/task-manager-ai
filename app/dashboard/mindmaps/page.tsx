"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader, AlertCircle } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { Navigation } from "@/components/Navigation";
import { Project } from "@/lib/types";
import Link from "next/link";

interface MindMap {
  id: string;
  title: string;
  description?: string;
  nodeCount: number;
  isConverted: boolean;
  convertedAt?: string;
  rootProjectId?: string;
  createdAt: string;
  updatedAt: string;
  ownershipType?: "personal" | "team";
  teamId?: string;
  userId?: string;
  createdByUser?: { email: string; firstName?: string; lastName?: string };
  lastModifiedByUser?: { email: string; firstName?: string; lastName?: string };
}

export default function MindMapsPage() {
  const router = useRouter();
  const api = useApi();
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [personalMaps, setPersonalMaps] = useState<MindMap[]>([]);
  const [teamMaps, setTeamMaps] = useState<MindMap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState<string>("User");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    // Load user data from localStorage (browser-side only)
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem("userEmail") || "";
      setUserName(email);
      setUserEmail(email);
      setIsAdmin(localStorage.getItem("isAdmin") === "true");
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Load all mind maps (including converted ones)
      const mindmapsResponse = await api.get("/mindmaps?includeConverted=true");
      const allMaps = mindmapsResponse.data || [];
      setMindMaps(allMaps);

      // Separate personal and team mind maps
      const personal = allMaps.filter((m: MindMap) => m.ownershipType === "personal" || !m.teamId);
      const team = allMaps.filter((m: MindMap) => m.ownershipType === "team" || m.teamId);
      setPersonalMaps(personal);
      setTeamMaps(team);

      // Load projects for navigation
      try {
        const projectsResponse = await api.getProjects();
        if (projectsResponse.success && projectsResponse.data) {
          setProjects(projectsResponse.data);
        }
      } catch {
        // Projects not available
      }

      // Load subscription to check plan
      try {
        const subscriptionResponse = await api.get("/subscriptions/current");
        setUserPlan(subscriptionResponse.data?.plan);
      } catch {
        // Subscription endpoint might not exist or user is on free plan
      }

    } catch (err) {
      setError("Failed to load mind maps");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    // Check if user can create mind maps
    if (userPlan === "FREE") {
      setError("Mind mapping is available on PRO and ENTERPRISE plans. Upgrade your plan to create mind maps.");
      return;
    }

    router.push("/dashboard/mindmaps/new");
  };

  const handleEdit = (mindMapId: string) => {
    router.push(`/dashboard/mindmaps/${mindMapId}`);
  };

  const handleDelete = async (mindMapId: string, teamId?: string) => {
    if (!confirm("Are you sure you want to delete this mind map?")) {
      return;
    }

    try {
      setIsLoading(true);
      // Use team endpoint if teamId is provided, otherwise use personal endpoint
      const endpoint = teamId
        ? `/teams/${teamId}/mindmaps/${mindMapId}`
        : `/mindmaps/${mindMapId}`;
      await api.delete(endpoint);
      setMindMaps(mindMaps.filter((m) => m.id !== mindMapId));
    } catch (err) {
      setError("Failed to delete mind map");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    router.push("/");
  };

  const handleViewChange = (view: string) => {
    if (view === "dashboard") {
      router.push("/dashboard");
    } else if (view === "projects") {
      router.push("/dashboard?view=projects");
    } else if (view === "all-tasks") {
      router.push("/dashboard?view=all-tasks");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        projects={projects}
        activeView="mindmaps"
        onViewChange={handleViewChange}
        onProjectSelect={() => {}}
        pendingTaskCount={0}
        userName={userName}
        userEmail={userEmail}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onSettingsClick={() => setShowUserSettings(true)}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mind Maps</h1>
          <p className="text-gray-600 mt-2">Create visual mind maps and convert to projects</p>
        </div>
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Plan info */}
        {userPlan === "FREE" && (
          <div className="mb-6 p-4 bg-blue-100 border border-blue-400 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-1">Upgrade to use Mind Maps</h3>
            <p className="text-blue-800 text-sm mb-3">
              Mind mapping is available on PRO and ENTERPRISE plans. Create visual representations of your projects and automatically convert them to tasks.
            </p>
            <button
              onClick={() => router.push("/upgrade")}
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700"
            >
              Upgrade Now
            </button>
          </div>
        )}

        {/* Create button */}
        {userPlan !== "FREE" && (
          <div className="mb-8">
            <button
              onClick={handleCreateNew}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Mind Map
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading mind maps...</span>
          </div>
        ) : mindMaps.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No mind maps yet</h3>
            <p className="text-gray-600">
              {userPlan === "FREE"
                ? "Upgrade your plan to start creating mind maps"
                : "Click the 'Create New Mind Map' button above to get started"}
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Personal Mind Maps Section */}
            {personalMaps.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Personal Mind Maps</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {personalMaps.map((mindMap) => (
                    <MindMapCard key={mindMap.id} mindMap={mindMap} onEdit={handleEdit} onDelete={(id) => handleDelete(id, undefined)} />
                  ))}
                </div>
              </div>
            )}

            {/* Team Mind Maps Section */}
            {teamMaps.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Team Mind Maps</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teamMaps.map((mindMap) => (
                    <MindMapCard key={mindMap.id} mindMap={mindMap} onEdit={handleEdit} onDelete={(id) => handleDelete(id, mindMap.teamId)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Mind Map Card Component
function MindMapCard({ mindMap, onEdit, onDelete }: { mindMap: MindMap; onEdit: (id: string) => void; onDelete: (id: string) => void }) {
  const isTeam = mindMap.ownershipType === "team";
  const createdByName = mindMap.createdByUser?.firstName || mindMap.createdByUser?.lastName
    ? `${mindMap.createdByUser?.firstName || ""} ${mindMap.createdByUser?.lastName || ""}`.trim()
    : mindMap.createdByUser?.email;

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
      {/* Ownership Badge */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 flex-1">
          {mindMap.title}
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${
          isTeam
            ? "bg-purple-100 text-purple-700"
            : "bg-blue-100 text-blue-700"
        }`}>
          {isTeam ? "Team" : "Personal"}
        </span>
      </div>

      {mindMap.description && (
        <p className="text-gray-600 text-sm mb-3">{mindMap.description}</p>
      )}

      <div className="space-y-2 mb-4">
        <div className="text-sm text-gray-500">
          <span className="font-medium">Nodes:</span> {mindMap.nodeCount}
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-medium">Created:</span>{" "}
          {new Date(mindMap.createdAt).toLocaleDateString()}
        </div>
        {isTeam && createdByName && (
          <div className="text-sm text-gray-500">
            <span className="font-medium">Created by:</span> {createdByName}
          </div>
        )}
      </div>

      {mindMap.isConverted && mindMap.convertedAt && (
        <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded">
          <p className="text-xs text-green-700 font-medium">
            ✓ Converted to projects
          </p>
          <p className="text-xs text-green-600">
            {new Date(mindMap.convertedAt).toLocaleDateString()}
          </p>
          <p className="text-xs text-green-600 mt-1">
            You can still edit and convert again if needed
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(mindMap.id)}
          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded font-medium text-sm hover:bg-blue-700"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(mindMap.id)}
          className="flex-1 bg-red-600 text-white px-3 py-2 rounded font-medium text-sm hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
