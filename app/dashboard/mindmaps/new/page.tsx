"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MindMapEditor from "@/components/MindMapEditor";
import { ArrowLeft, X } from "lucide-react";
import { useApi } from "@/lib/useApi";

interface Team {
  id: string;
  name: string;
  slug: string;
}

export default function NewMindMapPage() {
  const router = useRouter();
  const api = useApi();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showTeamSelector, setShowTeamSelector] = useState(true);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [userPlan, setUserPlan] = useState<string | null>(null);

  useEffect(() => {
    loadTeamsAndPlan();
  }, []);

  const loadTeamsAndPlan = async () => {
    try {
      setIsLoadingTeams(true);
      // Load user's teams
      const teamsResponse = await api.get("/teams");
      if (teamsResponse.data) {
        setTeams(teamsResponse.data);
      }

      // Load subscription plan
      try {
        const subResponse = await api.get("/subscriptions/current");
        setUserPlan(subResponse.data?.plan);
      } catch {
        // Silently fail
      }
    } catch (err) {
      console.error("Failed to load teams", err);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const handleTeamSelect = (teamId: string | null) => {
    setSelectedTeamId(teamId);
    setShowTeamSelector(false);
  };

  if (showTeamSelector) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Mind Map</h2>
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-gray-600 mb-6">
            Choose whether to create a personal or team mind map:
          </p>

          {isLoadingTeams ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
              <p className="text-gray-600 mt-2">Loading teams...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Personal Mind Map Option */}
              <button
                onClick={() => handleTeamSelect(null)}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <h3 className="font-semibold text-gray-900 mb-1">
                  📝 Personal Mind Map
                </h3>
                <p className="text-sm text-gray-600">
                  Only you can access and manage this mind map
                </p>
              </button>

              {/* Team Mind Maps Section */}
              {userPlan === "ENTERPRISE" && teams.length > 0 && (
                <>
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Team Mind Maps:
                    </p>
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => handleTeamSelect(team.id)}
                        className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
                      >
                        <h3 className="font-semibold text-gray-900 mb-1">
                          👥 {team.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Shared with your team
                        </p>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Enterprise Required */}
              {userPlan !== "ENTERPRISE" && teams.length > 0 && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">Upgrade to ENTERPRISE</span> to
                    create team mind maps
                  </p>
                </div>
              )}

              {/* No Teams */}
              {teams.length === 0 && userPlan === "ENTERPRISE" && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    You're not a member of any teams. Create or join a team to
                    create team mind maps.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Back button */}
      <div className="bg-gray-800 text-white p-4 flex items-center gap-2">
        <button
          onClick={() => setShowTeamSelector(true)}
          className="hover:bg-gray-700 rounded p-2 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm">
          {selectedTeamId
            ? teams.find((t) => t.id === selectedTeamId)?.name ||
              "Team Mind Map"
            : "Personal Mind Map"}
        </span>
      </div>

      {/* Editor */}
      <MindMapEditor
        initialTitle="New Mind Map"
        teamId={selectedTeamId || undefined}
        onSave={(mindMapId) => {
          // After saving, redirect to the mind map editor
          router.push(`/dashboard/mindmaps/${mindMapId}`);
        }}
      />
    </div>
  );
}
