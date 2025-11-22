"use client";

import { Project } from "@/lib/types";
import { useState } from "react";

interface ProjectTabsProps {
  projects: Project[];
  activeProjectId?: string;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onEditProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onCreateSubproject: (parentId: string) => void;
}

// Helper function to get color values for projects
const colorMap: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  blue: { bg: "#EFF6FF", text: "#0C2340", border: "#3B82F6", dot: "#3B82F6" },
  red: { bg: "#FEF2F2", text: "#7F1D1D", border: "#EF4444", dot: "#EF4444" },
  green: { bg: "#F0FDF4", text: "#0F5132", border: "#22C55E", dot: "#22C55E" },
  yellow: { bg: "#FFFBEB", text: "#713F12", border: "#FBBF24", dot: "#FBBF24" },
  purple: { bg: "#FAF5FF", text: "#4A1172", border: "#A855F7", dot: "#A855F7" },
  pink: { bg: "#FDF2F8", text: "#831843", border: "#EC4899", dot: "#EC4899" },
  indigo: { bg: "#EEF2FF", text: "#1E1B4B", border: "#6366F1", dot: "#6366F1" },
  cyan: { bg: "#ECFDF5", text: "#0F4C75", border: "#06B6D4", dot: "#06B6D4" },
};

function getProjectColors(color: string) {
  return colorMap[color] || colorMap.blue;
}

function findChildProjects(projects: Project[] | undefined, parentId: string): Project[] {
  return (projects || []).filter((p) => p.parentProjectId === parentId);
}

export function ProjectTabs({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onCreateSubproject,
}: ProjectTabsProps) {
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [showContextMenu, setShowContextMenu] = useState<{ projectId: string; x: number; y: number } | null>(null);

  // Filter to only root projects
  const rootProjects = (projects || []).filter((p) => !p.parentProjectId);

  const handleProjectClick = (projectId: string) => {
    onSelectProject(projectId);
    setExpandedProjectId(null); // Close dropdown when selecting
  };

  const handleExpandClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
  };

  const handleContextMenu = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContextMenu({ projectId, x: e.clientX, y: e.clientY });
  };

  const handleContextMenuClick = (action: "edit" | "delete" | "subproject", projectId: string) => {
    if (action === "edit") {
      onEditProject(projectId);
    } else if (action === "delete") {
      if (window.confirm("Are you sure you want to delete this project?")) {
        onDeleteProject(projectId);
      }
    } else if (action === "subproject") {
      onCreateSubproject(projectId);
    }
    setShowContextMenu(null);
  };

  return (
    <>
      <div className="border-t border-gray-100 bg-white overflow-x-auto">
        <div className="flex items-center gap-1 px-2 py-2 min-w-min">
          {/* Empty State - No Projects */}
          {rootProjects.length === 0 && (
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 text-sm font-medium rounded-md mx-1 border border-blue-200">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>No projects yet. Create one to get started →</span>
            </div>
          )}

          {/* Root Projects as Tabs */}
          {rootProjects.map((project) => {
            const isActive = activeProjectId === project.id;
            const hasChildren = findChildProjects(projects, project.id).length > 0;
            const isExpanded = expandedProjectId === project.id;
            const colors = getProjectColors(project.color);

            return (
              <div key={project.id} className="relative">
                <button
                  onClick={() => handleProjectClick(project.id)}
                  onContextMenu={(e) => handleContextMenu(e, project.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-sm font-medium transition whitespace-nowrap ${
                    isActive
                      ? "border-b-2 border-b-transparent"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: colors.bg,
                          color: colors.text,
                          borderBottom: `3px solid ${colors.border}`,
                        }
                      : {}
                  }
                >
                  {/* Project Color Dot */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colors.dot }}
                  />

                  {/* Project Name */}
                  <span>{project.name}</span>

                  {/* Expand Arrow (if has subprojects) */}
                  {hasChildren && (
                    <button
                      onClick={(e) => handleExpandClick(e, project.id)}
                      className={`p-0.5 hover:bg-gray-200 rounded transition ${
                        isActive ? "hover:opacity-70" : ""
                      }`}
                      title={isExpanded ? "Hide subprojects" : "Show subprojects"}
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </button>
                  )}
                </button>

                {/* Subprojects Dropdown */}
                {hasChildren && isExpanded && (
                  <div className="absolute top-full left-0 z-50 mt-0 bg-white border border-gray-200 rounded-b-lg shadow-lg min-w-max">
                    {findChildProjects(projects, project.id).map((subproject) => {
                      const isSubActive = activeProjectId === subproject.id;
                      const subColors = getProjectColors(subproject.color);

                      return (
                        <button
                          key={subproject.id}
                          onClick={() => handleProjectClick(subproject.id)}
                          onContextMenu={(e) => handleContextMenu(e, subproject.id)}
                          className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition border-b border-gray-100 last:border-b-0 ${
                            isSubActive
                              ? "bg-gray-100 font-medium"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {/* Subproject Color Dot */}
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: subColors.dot }}
                          />

                          {/* Subproject Name (indented) */}
                          <span className="text-left">→ {subproject.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Divider */}
          {rootProjects.length > 0 && <div className="w-px h-6 bg-gray-200 mx-1" />}

          {/* Create Project Button */}
          <button
            onClick={onCreateProject}
            className={`flex items-center gap-1 px-3 py-1.5 font-medium rounded-lg transition whitespace-nowrap ${
              rootProjects.length === 0
                ? "px-4 py-2 text-base bg-blue-600 text-white hover:bg-blue-700"
                : "text-sm text-blue-600 hover:bg-blue-50"
            }`}
            title="Create new project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {rootProjects.length === 0 ? "Create Project" : "New"}
          </button>
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-max"
          style={{ top: `${showContextMenu.y}px`, left: `${showContextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleContextMenuClick("edit", showContextMenu.projectId)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </button>
          <button
            onClick={() => handleContextMenuClick("subproject", showContextMenu.projectId)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Subproject
          </button>
          <button
            onClick={() => handleContextMenuClick("delete", showContextMenu.projectId)}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
          </button>
        </div>
      )}

      {/* Overlay to close context menu */}
      {showContextMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowContextMenu(null)}
        />
      )}
    </>
  );
}
