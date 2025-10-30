"use client";

import { useState, useEffect } from "react";
import { Project } from "@/lib/types";

interface ProjectHierarchyModalProps {
  isOpen: boolean;
  isEditing?: boolean;
  project?: Project;
  parentProjectId?: string;
  allProjects: Project[];
  userPlan: "FREE" | "PRO" | "ENTERPRISE";
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onClose: () => void;
}

export interface ProjectFormData {
  name: string;
  description?: string;
  color: string;
  parentProjectId?: string;
  startDate?: string;
  endDate?: string;
  owner?: string;
  budget?: number;
  budget_currency?: string;
}

const COLOR_OPTIONS = [
  { name: "blue", hex: "#3b82f6" },
  { name: "red", hex: "#ef4444" },
  { name: "green", hex: "#10b981" },
  { name: "yellow", hex: "#f59e0b" },
  { name: "purple", hex: "#8b5cf6" },
  { name: "pink", hex: "#ec4899" },
  { name: "indigo", hex: "#6366f1" },
  { name: "cyan", hex: "#06b6d4" },
];

export function ProjectHierarchyModal({
  isOpen,
  isEditing = false,
  project,
  parentProjectId,
  allProjects,
  userPlan,
  onSubmit,
  onClose,
}: ProjectHierarchyModalProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    color: "blue",
    parentProjectId: parentProjectId,
    startDate: "",
    endDate: "",
    owner: "",
    budget: undefined,
    budget_currency: "USD",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with project data if editing
  useEffect(() => {
    if (isEditing && project) {
      setFormData({
        name: project.name,
        description: project.description || "",
        color: project.color,
        parentProjectId: project.parentProjectId || undefined,
        startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
        endDate: project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "",
        owner: project.owner || "",
        budget: project.budget || undefined,
        budget_currency: project.budget_currency || "USD",
      });
    } else if (parentProjectId) {
      setFormData((prev) => ({
        ...prev,
        parentProjectId,
      }));
    }
  }, [isEditing, project, parentProjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Project name is required");
      return;
    }

    // Check if creating subproject on FREE plan
    if (!isEditing && formData.parentProjectId && userPlan === "FREE") {
      setError("Free plan does not support subprojects. Upgrade to PRO to create subprojects.");
      return;
    }

    // Validate dates
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start > end) {
        setError("End date must be after start date");
        return;
      }
    }

    try {
      setLoading(true);
      await onSubmit(formData);
      setFormData({
        name: "",
        description: "",
        color: "blue",
        parentProjectId: undefined,
        startDate: "",
        endDate: "",
        owner: "",
        budget: undefined,
        budget_currency: "USD",
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Get parent project info if creating subproject
  const parentProject = formData.parentProjectId
    ? allProjects.find((p) => p.id === formData.parentProjectId)
    : null;

  // Get available projects for parent selection (exclude current project)
  const availableParents = allProjects.filter(
    (p) => !isEditing || p.id !== project?.id
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? "Edit Project" : "Create Project"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Parent Project Info */}
          {parentProject && !isEditing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>Parent Project:</strong> {parentProject.name}
              </p>
              {userPlan === "FREE" && (
                <p className="text-xs text-blue-800 mt-1">
                  ⚠️ Free plan does not support subprojects. Please upgrade to PRO.
                </p>
              )}
            </div>
          )}

          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Website Redesign"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add project description..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
              disabled={loading}
            />
          </div>

          {/* Two Column Layout for smaller fields */}
          <div className="grid grid-cols-2 gap-4">
            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.name })}
                    className={`w-8 h-8 rounded-full border-2 transition ${
                      formData.color === color.name
                        ? "border-gray-900"
                        : "border-transparent hover:border-gray-300"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            {/* Owner */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Owner
              </label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                placeholder="e.g., John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                disabled={loading}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                disabled={loading}
              />
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={formData.budget || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    budget: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="0.00"
                step="0.01"
                min="0"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                disabled={loading}
              />
              <select
                value={formData.budget_currency}
                onChange={(e) => setFormData({ ...formData, budget_currency: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                disabled={loading}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditing ? "Update Project" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
