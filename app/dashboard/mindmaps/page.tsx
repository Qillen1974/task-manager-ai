"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader, AlertCircle, ArrowLeft } from "lucide-react";
import { useApi } from "@/lib/useApi";
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
}

export default function MindMapsPage() {
  const router = useRouter();
  const api = useApi();
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Load mind maps
      const mindmapsResponse = await api.get("/mindmaps?includeConverted=false");
      setMindMaps(mindmapsResponse.data || []);

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

  const handleDelete = async (mindMapId: string) => {
    if (!confirm("Are you sure you want to delete this mind map?")) {
      return;
    }

    try {
      setIsLoading(true);
      await api.delete(`/mindmaps/${mindMapId}`);
      setMindMaps(mindMaps.filter((m) => m.id !== mindMapId));
    } catch (err) {
      setError("Failed to delete mind map");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hover:bg-gray-100 rounded p-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mind Maps</h1>
            <p className="text-sm text-gray-600">Create visual mind maps and convert to projects</p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
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
            <p className="text-gray-600 mb-6">
              {userPlan === "FREE"
                ? "Upgrade your plan to start creating mind maps"
                : "Create your first mind map to get started"}
            </p>
            {userPlan !== "FREE" && (
              <button
                onClick={handleCreateNew}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Create Mind Map
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mindMaps.map((mindMap) => (
              <div
                key={mindMap.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {mindMap.title}
                </h3>
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
                </div>

                {mindMap.isConverted && mindMap.convertedAt && (
                  <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-xs text-green-700">
                      ✓ Converted on{" "}
                      {new Date(mindMap.convertedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(mindMap.id)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded font-medium text-sm hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(mindMap.id)}
                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded font-medium text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
