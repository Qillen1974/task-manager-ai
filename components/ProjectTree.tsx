"use client";

import { useState } from "react";
import { Project } from "@/lib/types";

interface ProjectTreeProps {
  projects: Project[];
  activeProjectId?: string;
  onSelectProject: (projectId: string) => void;
  onCreateSubproject?: (parentProjectId: string) => void;
  onEditProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
}

interface TreeNode extends Project {
  children?: TreeNode[];
  isExpanded?: boolean;
}

export function ProjectTree({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateSubproject,
  onEditProject,
  onDeleteProject,
}: ProjectTreeProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const toggleExpand = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const renderProjectNode = (project: TreeNode, level: number = 0) => {
    const isExpanded = expandedProjects.has(project.id);
    const hasChildren = project.children && project.children.length > 0;
    const isActive = activeProjectId === project.id;

    return (
      <div key={project.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition cursor-pointer group ${
            isActive
              ? "bg-blue-100 border-l-4 border-blue-500"
              : "hover:bg-gray-100 border-l-4 border-transparent"
          }`}
          style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
        >
          {/* Expand/Collapse Arrow */}
          {hasChildren && (
            <button
              onClick={() => toggleExpand(project.id)}
              className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              <svg
                className={`w-4 h-4 transition transform ${isExpanded ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
          {!hasChildren && <div className="w-5" />}

          {/* Color Indicator */}
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: project.color || "#3b82f6" }}
            title={project.color}
          />

          {/* Project Name */}
          <button
            onClick={() => onSelectProject(project.id)}
            className="flex-1 text-left text-sm font-medium text-gray-900 truncate hover:text-blue-600 transition"
          >
            {project.name}
          </button>

          {/* Task Count Badge */}
          {(project as any).taskCount !== undefined && (
            <span className="flex-shrink-0 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full font-medium">
              {(project as any).taskCount}
            </span>
          )}

          {/* Action Buttons (shown on hover) */}
          <div className="flex-shrink-0 gap-1 hidden group-hover:flex">
            {onCreateSubproject && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateSubproject(project.id);
                }}
                className="p-1 text-green-600 hover:bg-green-100 rounded transition"
                title="Add subproject"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            )}
            {onEditProject && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditProject(project.id);
                }}
                className="p-1 text-blue-600 hover:bg-blue-100 rounded transition"
                title="Edit project"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
            {onDeleteProject && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete "${project.name}" and all its subprojects?`)) {
                    onDeleteProject(project.id);
                  }
                }}
                className="p-1 text-red-600 hover:bg-red-100 rounded transition"
                title="Delete project"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Render Children */}
        {hasChildren && isExpanded && (
          <div>
            {project.children!.map((child) => renderProjectNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {projects.length === 0 ? (
        <div className="px-3 py-4 text-center text-gray-500 text-sm">
          No projects yet. Create one to get started!
        </div>
      ) : (
        projects.map((project) => renderProjectNode(project as TreeNode))
      )}
    </div>
  );
}
