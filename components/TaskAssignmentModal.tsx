"use client";

import { useState } from "react";
import { Task, TaskAssignmentRole } from "@/lib/types";

interface TeamMember {
  userId: string;
  name?: string;
  email?: string;
  role: string;
}

interface TaskAssignmentModalProps {
  task: Task;
  teamMembers: TeamMember[];
  onAssign: (userId: string, role: TaskAssignmentRole) => Promise<void>;
  onRoleChange?: (assignmentId: string, role: TaskAssignmentRole) => Promise<void>;
  onRemoveAssignment?: (assignmentId: string) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
  canEditAssignments?: boolean;
}

interface MemberAssignment {
  userId: string;
  role: TaskAssignmentRole;
}

export function TaskAssignmentModal({
  task,
  teamMembers,
  onAssign,
  onRoleChange,
  onRemoveAssignment,
  onClose,
  isLoading = false,
  canEditAssignments = false
}: TaskAssignmentModalProps) {
  const [assignments, setAssignments] = useState<Map<string, TaskAssignmentRole>>(new Map());
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [editingRoles, setEditingRoles] = useState<Map<string, TaskAssignmentRole>>(new Map());
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const assignedUserIds = new Set(task.assignments?.map(a => a.userId) || []);
  const availableMembers = teamMembers.filter(m => !assignedUserIds.has(m.userId));

  const toggleMemberSelection = (userId: string) => {
    const newAssignments = new Map(assignments);
    if (newAssignments.has(userId)) {
      newAssignments.delete(userId);
    } else {
      newAssignments.set(userId, "COLLABORATOR");
    }
    setAssignments(newAssignments);
  };

  const updateMemberRole = (userId: string, role: TaskAssignmentRole) => {
    const newAssignments = new Map(assignments);
    newAssignments.set(userId, role);
    setAssignments(newAssignments);
  };

  const handleAssignMultiple = async () => {
    if (assignments.size === 0) {
      setError("Please select at least one team member");
      return;
    }

    try {
      setError("");
      setIsAssigning(true);

      // Assign each selected member with their chosen role
      const assignmentEntries = Array.from(assignments.entries());
      for (const [userId, role] of assignmentEntries) {
        await onAssign(userId, role);
      }

      setSuccess(`Assigned ${assignments.size} member${assignments.size > 1 ? 's' : ''}`);
      setAssignments(new Map());

      // Reset success message after 2 seconds
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign task");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUpdateRole = async (assignmentId: string, newRole: TaskAssignmentRole) => {
    if (!onRoleChange) return;

    try {
      setError("");
      setIsUpdatingRole(true);
      await onRoleChange(assignmentId, newRole);
      setEditingRoles(new Map());
      setSuccess("Role updated successfully");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!onRemoveAssignment) return;

    try {
      setError("");
      setIsUpdatingRole(true);
      await onRemoveAssignment(assignmentId);
      setSuccess("Assignment removed successfully");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove assignment");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const getMemberDisplayName = (member: TeamMember) => {
    return member.name || member.email || member.userId;
  };

  const roleOptions: TaskAssignmentRole[] = ["OWNER", "COLLABORATOR", "REVIEWER"];

  const getRoleDescription = (role: TaskAssignmentRole) => {
    switch (role) {
      case "OWNER":
        return "Primary responsibility";
      case "COLLABORATOR":
        return "Helping with task";
      case "REVIEWER":
        return "Reviewing/approving";
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4 max-h-96 overflow-y-auto">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Assign Task</h2>
          <p className="text-sm text-gray-600 mt-1">{task.title}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
            ✓ {success}
          </div>
        )}

        {/* Team Member Selection with Per-Member Role Assignment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Members and Assign Roles ({assignments.size} selected)
          </label>
          {availableMembers.length > 0 ? (
            <div className="space-y-3 border border-gray-300 rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto">
              {availableMembers.map((member) => (
                <div key={member.userId} className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded transition">
                  <div className="flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={assignments.has(member.userId)}
                      onChange={() => toggleMemberSelection(member.userId)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {getMemberDisplayName(member)}
                    </p>
                    {member.email && member.name && (
                      <p className="text-xs text-gray-500 truncate">{member.email}</p>
                    )}
                  </div>

                  {/* Role selector - only visible when member is selected */}
                  {assignments.has(member.userId) && (
                    <div className="flex-shrink-0">
                      <select
                        value={assignments.get(member.userId) || "COLLABORATOR"}
                        onChange={(e) => updateMemberRole(member.userId, e.target.value as TaskAssignmentRole)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      >
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
              All team members are already assigned to this task
            </div>
          )}
        </div>

        {/* Assignment Summary */}
        {assignments.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-900 mb-2">Assignment Summary:</p>
            <div className="space-y-1">
              {Array.from(assignments.entries()).map(([userId, role]) => {
                const member = teamMembers.find(m => m.userId === userId);
                return (
                  <div key={userId} className="text-sm text-blue-800 flex items-center justify-between">
                    <span>{getMemberDisplayName(member || { userId })}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      role === "OWNER"
                        ? "bg-red-100 text-red-800"
                        : role === "COLLABORATOR"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                    }`}>
                      {role}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Current Assignments */}
        {task.assignments && task.assignments.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Current Assignments:</p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {task.assignments.map((assignment) => {
                const assignedMember = teamMembers.find(m => m.userId === assignment.userId);
                const displayName = assignedMember?.name || assignedMember?.email || assignment.userId;
                const isEditingThis = editingRoles.has(assignment.id);
                const currentRole = editingRoles.get(assignment.id) || assignment.role;

                return (
                  <div key={assignment.id} className="text-sm text-gray-600 flex items-center justify-between gap-2 p-2 bg-white rounded hover:bg-gray-50 transition">
                    <span className="truncate flex-1">{displayName}</span>

                    {canEditAssignments && isEditingThis ? (
                      <div className="flex gap-2 items-center">
                        <select
                          value={currentRole}
                          onChange={(e) => setEditingRoles(new Map(editingRoles).set(assignment.id, e.target.value as TaskAssignmentRole))}
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          disabled={isUpdatingRole}
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleUpdateRole(assignment.id, currentRole)}
                          disabled={isUpdatingRole || currentRole === assignment.role}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setEditingRoles(new Map())}
                          disabled={isUpdatingRole}
                          className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500 disabled:cursor-not-allowed transition"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                          assignment.role === "OWNER"
                            ? "bg-red-100 text-red-800"
                            : assignment.role === "COLLABORATOR"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                        }`}>
                          {assignment.role}
                        </span>
                        {canEditAssignments && (
                          <button
                            onClick={() => setEditingRoles(new Map(editingRoles).set(assignment.id, assignment.role))}
                            disabled={isUpdatingRole}
                            className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded disabled:cursor-not-allowed transition"
                            title="Edit role"
                          >
                            ✎
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleAssignMultiple}
            disabled={assignments.size === 0 || isAssigning || isLoading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isAssigning ? "Assigning..." : `Assign ${assignments.size > 0 ? `(${assignments.size})` : ""}`}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
