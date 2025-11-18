"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { useApi } from "@/lib/useApi";
import { AuthPage } from "@/components/AuthPage";
import WorkspacePanel from "@/components/WorkspacePanel";
import { ArrowLeft, Users, Mail, Trash2, Edit2, Check, X, Plus, Loader, FolderPlus } from "lucide-react";
import Link from "next/link";

interface TeamMember {
  id: string;
  userId: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
  acceptedAt: string | null;
  invitedAt: string;
  invitedBy: string | null;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    name: string | null;
  };
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  ownerId: string;
  userRole: string;
  members: TeamMember[];
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
}

export default function TeamDetailsPage() {
  const api = useApi();
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"EDITOR" | "VIEWER">("VIEWER");
  const [inviting, setInviting] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<"ADMIN" | "EDITOR" | "VIEWER">("VIEWER");

  // Team projects state
  const [teamProjects, setTeamProjects] = useState<any[]>([]);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectColor, setProjectColor] = useState("blue");
  const [projectDescription, setProjectDescription] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get("/auth/me");
      if (response.data) {
        setAuthenticated(true);
        loadTeamDetails();
      }
    } catch (err) {
      setAuthenticated(false);
      setLoading(false);
    }
  };

  const loadTeamDetails = async () => {
    try {
      setLoading(true);
      const [teamRes, projectsRes] = await Promise.all([
        api.get(`/teams/${teamId}`),
        api.get(`/projects?includeChildren=true`).catch(() => ({ data: [] })),
      ]);

      if (teamRes.data) {
        setTeam(teamRes.data);

        // Only load invitations if user is admin
        if (teamRes.data.userRole === "ADMIN") {
          try {
            const invitationsRes = await api.get(`/teams/${teamId}/invitations`);
            if (invitationsRes.data) {
              setInvitations(invitationsRes.data);
            }
          } catch (err) {
            // Silently ignore invitation load errors
            console.error("Failed to load invitations:", err);
          }
        }
      }
      // Filter projects for this team
      if (projectsRes.data) {
        const filtered = projectsRes.data.filter((p: any) => p.teamId === teamId);
        setTeamProjects(filtered);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load team");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setError("Email is required");
      return;
    }

    try {
      setInviting(true);
      const response = await api.post(`/teams/${teamId}/invitations`, {
        email: inviteEmail,
        role: inviteRole,
      });

      if (response.data) {
        setInvitations([response.data, ...invitations]);
        setInviteEmail("");
        setInviteRole("VIEWER");
        setShowInviteModal(false);
        setError(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, userId: string, newRole: "ADMIN" | "EDITOR" | "VIEWER") => {
    try {
      await api.patch(`/teams/${teamId}/members`, {
        userId,
        role: newRole,
      });

      // Update local state
      if (team) {
        const updatedMembers = team.members.map((m) =>
          m.id === memberId ? { ...m, role: newRole } : m
        );
        setTeam({ ...team, members: updatedMembers });
      }
      setEditingMemberId(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to update member role");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member from the team?")) {
      return;
    }

    try {
      await api.delete(`/teams/${teamId}/members`, {
        userId,
      });

      // Update local state
      if (team && team.members) {
        const updatedMembers = team.members.filter((m) => m.userId !== userId);
        setTeam({ ...team, members: updatedMembers });
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to remove member");
    }
  };

  const handleCreateTeamProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setError("Project name is required");
      return;
    }

    try {
      setCreatingProject(true);
      const response = await api.post("/projects", {
        name: projectName,
        color: projectColor,
        description: projectDescription,
        teamId: teamId,
      });

      if (response.data) {
        setTeamProjects([response.data, ...teamProjects]);
        setProjectName("");
        setProjectColor("blue");
        setProjectDescription("");
        setShowCreateProjectModal(false);
        setError(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to create project");
    } finally {
      setCreatingProject(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      return;
    }

    if (!confirm("This will permanently delete the team and all its data. Click OK to confirm.")) {
      return;
    }

    try {
      await api.delete(`/teams/${teamId}`);
      // Redirect back to teams page after successful deletion
      router.push("/dashboard/teams");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to delete team");
    }
  };

  if (!authenticated) {
    return <AuthPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-red-600">Team not found</p>
            <Link href="/dashboard/teams" className="text-blue-600 hover:underline mt-4 inline-block">
              Back to Teams
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = team.userRole === "ADMIN";

  const handleNavViewChange = (view: string) => {
    // Navigate to the main dashboard with the view query parameter
    // Dashboard will initialize its state from the URL parameter
    if (view === "mindmaps") {
      router.push("/dashboard/mindmaps");
    } else if (view === "teams") {
      router.push("/dashboard/teams");
    } else {
      // For dashboard, all-tasks, and projects views - navigate to main dashboard with view parameter
      router.push(`/dashboard?view=${view}`);
    }
  };

  const handleNavProjectSelect = (projectId: string) => {
    router.push(`/dashboard?projectId=${projectId}`);
  };

  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('isAdmin');
    // Redirect to login
    router.push('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        projects={teamProjects}
        activeView="teams"
        onViewChange={handleNavViewChange}
        onProjectSelect={handleNavProjectSelect}
        pendingTaskCount={0}
        userName={localStorage.getItem("userName") || localStorage.getItem("userEmail") || "User"}
        userEmail={localStorage.getItem("userEmail") || ""}
        onLogout={handleLogout}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href="/dashboard/teams" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Teams
        </Link>

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

        {/* Team Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
              <p className="text-gray-600 mt-1">@{team.slug}</p>
              {team.description && <p className="text-gray-700 mt-2">{team.description}</p>}
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">
                {team.userRole}
              </span>
              {isAdmin && (
                <button
                  onClick={handleDeleteTeam}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete team"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
              <p className="text-sm text-gray-600 mt-1">
                {team.members?.length || 0} member{team.members?.length !== 1 ? "s" : ""}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                Invite Member
              </button>
            )}
          </div>

          {/* Members List */}
          <div className="space-y-3">
            {team.members && team.members.length > 0 ? (
              team.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">
                    {member.user?.name || `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim() || member.user?.email || member.userId}
                  </p>
                  <p className="text-sm text-gray-600">{member.user?.email || member.userId}</p>
                  {!member.acceptedAt && (
                    <p className="text-xs text-yellow-600 mt-1">Invitation pending</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {editingMemberId === member.id ? (
                    <>
                      <select
                        value={editingRole}
                        onChange={(e) =>
                          setEditingRole(e.target.value as "ADMIN" | "EDITOR" | "VIEWER")
                        }
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="EDITOR">EDITOR</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                      <button
                        onClick={() => handleUpdateMemberRole(member.id, member.userId, editingRole)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingMemberId(null)}
                        className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800 capitalize">
                        {member.role}
                      </span>
                      {isAdmin && member.userId !== team.ownerId && (
                        <>
                          <button
                            onClick={() => {
                              setEditingMemberId(member.id);
                              setEditingRole(member.role);
                            }}
                            className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member.userId)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No team members yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Invitations */}
        {isAdmin && invitations.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Invitations</h2>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{invitation.email}</p>
                      <p className="text-xs text-gray-600">
                        Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800 capitalize">
                    {invitation.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Projects */}
        {team && team.userRole && (["ADMIN", "EDITOR"] as string[]).includes(team.userRole) && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mt-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Team Projects</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {teamProjects.length} project{teamProjects.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setShowCreateProjectModal(true)}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                <FolderPlus className="w-4 h-4" />
                Create Project
              </button>
            </div>

            {teamProjects.length > 0 ? (
              <div className="space-y-3">
                {teamProjects.map((project) => (
                  <Link key={project.id} href={`/dashboard?projectId=${project.id}`}>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              {
                                blue: "#3B82F6",
                                red: "#EF4444",
                                green: "#10B981",
                                yellow: "#FBBF24",
                                purple: "#A78BFA",
                                pink: "#EC4899",
                                indigo: "#6366F1",
                                cyan: "#06B6D4",
                              }[project.color as string] || "#3B82F6",
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{project.name}</p>
                          {project.description && (
                            <p className="text-xs text-gray-600 mt-1">{project.description}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-600">
                          {project.taskCount || 0} task{project.taskCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No team projects yet. Create one to get started!</p>
              </div>
            )}
          </div>
        )}

        {/* Workspace Section */}
        <div className="mt-6">
          <WorkspacePanel teamId={teamId} />
        </div>

        {/* Invite Modal */}
        {showInviteModal && isAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Invite Team Member</h2>
              <form onSubmit={handleInviteMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="member@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={inviting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as "EDITOR" | "VIEWER")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={inviting}
                  >
                    <option value="VIEWER">Viewer - Read-only access</option>
                    <option value="EDITOR">Editor - Can create and edit projects</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    disabled={inviting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                    disabled={inviting}
                  >
                    {inviting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Inviting...
                      </>
                    ) : (
                      "Send Invitation"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Team Project Modal */}
        {showCreateProjectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Create Team Project</h2>
              <form onSubmit={handleCreateTeamProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., Website Redesign"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={creatingProject}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <select
                    value={projectColor}
                    onChange={(e) => setProjectColor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={creatingProject}
                  >
                    <option value="blue">Blue</option>
                    <option value="red">Red</option>
                    <option value="green">Green</option>
                    <option value="yellow">Yellow</option>
                    <option value="purple">Purple</option>
                    <option value="pink">Pink</option>
                    <option value="indigo">Indigo</option>
                    <option value="cyan">Cyan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="What is this project about?"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={creatingProject}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateProjectModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    disabled={creatingProject}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                    disabled={creatingProject}
                  >
                    {creatingProject ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Project"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
