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
  onClose: () => void;
  isLoading?: boolean;
}

export function TaskAssignmentModal({
  task,
  teamMembers,
  onAssign,
  onClose,
  isLoading = false
}: TaskAssignmentModalProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [selectedRole, setSelectedRole] = useState<TaskAssignmentRole>("COLLABORATOR");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  const assignedUserIds = new Set(task.assignments?.map(a => a.userId) || []);
  const availableMembers = teamMembers.filter(m => !assignedUserIds.has(m.userId));

  const toggleMemberSelection = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleAssignMultiple = async () => {
    if (selectedUserIds.size === 0) {
      setError("Please select at least one team member");
      return;
    }

    try {
      setError("");
      setIsAssigning(true);

      // Assign each selected member with the chosen role
      const userIds = Array.from(selectedUserIds);
      for (const userId of userIds) {
        await onAssign(userId, selectedRole);
      }

      setSuccess(`Assigned ${userIds.length} member${userIds.length > 1 ? 's' : ''} as ${selectedRole.toLowerCase()}`);
      setSelectedUserIds(new Set());
      setSelectedRole("COLLABORATOR");

      // Reset success message after 2 seconds
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign task");
    } finally {
      setIsAssigning(false);
    }
  };

  const getMemberDisplayName = (member: TeamMember) => {
    return member.name || member.email || member.userId;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 max-h-96 overflow-y-auto">
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

        {/* Team Member Selection with Checkboxes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Team Members ({selectedUserIds.size} selected)
          </label>
          {availableMembers.length > 0 ? (
            <div className="space-y-2 border border-gray-300 rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto">
              {availableMembers.map((member) => (
                <label key={member.userId} className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded transition">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.has(member.userId)}
                    onChange={() => toggleMemberSelection(member.userId)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {getMemberDisplayName(member)}
                    </p>
                    {member.email && member.name && (
                      <p className="text-xs text-gray-500 truncate">{member.email}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
              All team members are already assigned to this task
            </div>
          )}
        </div>

        {/* Role Selection */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            Assign Role
          </label>
          <select
            id="role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as TaskAssignmentRole)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          >
            <option value="OWNER">Owner (Primary responsibility)</option>
            <option value="COLLABORATOR">Collaborator (Helper)</option>
            <option value="REVIEWER">Reviewer (Approval)</option>
          </select>
          <p className="text-xs text-gray-500 mt-2">
            {selectedRole === "OWNER" && "Primary person responsible for task completion"}
            {selectedRole === "COLLABORATOR" && "Helping with the task"}
            {selectedRole === "REVIEWER" && "Reviewing and approving the task"}
          </p>
        </div>

        {/* Current Assignments */}
        {task.assignments && task.assignments.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Current Assignments:</p>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {task.assignments.map((assignment) => {
                const assignedMember = teamMembers.find(m => m.userId === assignment.userId);
                const displayName = assignedMember?.name || assignedMember?.email || assignment.userId;

                return (
                  <div key={assignment.id} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                      assignment.role === "OWNER"
                        ? "bg-red-100 text-red-800"
                        : assignment.role === "COLLABORATOR"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                    }`}>
                      {assignment.role}
                    </span>
                    <span className="truncate">{displayName}</span>
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
            disabled={selectedUserIds.size === 0 || isAssigning || isLoading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isAssigning ? "Assigning..." : `Assign ${selectedUserIds.size > 0 ? `(${selectedUserIds.size})` : ""}`}
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
