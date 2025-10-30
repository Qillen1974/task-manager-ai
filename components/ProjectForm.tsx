"use client";

import { useState } from "react";
import { Project } from "@/lib/types";
import { generateId } from "@/lib/utils";

interface ProjectFormProps {
  onSubmit?: (project: Project) => void;
  onProjectAdd?: (project: Project) => void;
  onClose: () => void;
  editingProject?: Project;
  onProjectUpdate?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
}

const colors = ["blue", "red", "green", "purple", "pink", "indigo", "cyan", "amber"];

export function ProjectForm({ onSubmit, onProjectAdd, onClose, editingProject, onProjectUpdate, onDelete }: ProjectFormProps) {
  const [name, setName] = useState(editingProject?.name || "");
  const [description, setDescription] = useState(editingProject?.description || "");
  const [color, setColor] = useState(editingProject?.color || colors[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Project name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const project: Project = {
      id: editingProject?.id || generateId(),
      name,
      description,
      color,
      createdAt: editingProject?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Use onSubmit if provided (new way), otherwise use the old callbacks
    if (onSubmit) {
      onSubmit(project);
    } else if (editingProject && onProjectUpdate) {
      onProjectUpdate(project);
    } else if (onProjectAdd) {
      onProjectAdd(project);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-6">{editingProject ? "Edit Project" : "Create New Project"}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Project Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Color</label>
            <div className="grid grid-cols-4 gap-2">
              {colors.map((c) => {
                const colorMap: Record<string, string> = {
                  blue: "bg-blue-100 border-blue-700",
                  red: "bg-red-100 border-red-700",
                  green: "bg-green-100 border-green-700",
                  purple: "bg-purple-100 border-purple-700",
                  pink: "bg-pink-100 border-pink-700",
                  indigo: "bg-indigo-100 border-indigo-700",
                  cyan: "bg-cyan-100 border-cyan-700",
                  amber: "bg-amber-100 border-amber-700",
                };

                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-8 rounded-lg border-2 transition ${
                      color === c ? `border-2 ${colorMap[c]}` : "border-2 border-gray-300 hover:border-gray-400 bg-gray-50"
                    }`}
                    title={c}
                  />
                );
              })}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              {editingProject ? "Update Project" : "Create Project"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition font-medium"
            >
              Cancel
            </button>
            {editingProject && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this project?")) {
                    onDelete(editingProject.id);
                    onClose();
                  }
                }}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
