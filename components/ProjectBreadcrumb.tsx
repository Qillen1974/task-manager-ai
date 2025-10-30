"use client";

import { Project } from "@/lib/types";

interface ProjectBreadcrumbProps {
  project?: Project;
  allProjects: Project[];
  onProjectClick: (projectId: string) => void;
}

export function ProjectBreadcrumb({
  project,
  allProjects,
  onProjectClick,
}: ProjectBreadcrumbProps) {
  if (!project) {
    return null;
  }

  // Build breadcrumb path
  const buildPath = (proj: Project): Project[] => {
    const path: Project[] = [proj];
    let current = proj;

    while (current.parentProjectId) {
      const parent = allProjects.find((p) => p.id === current.parentProjectId);
      if (parent) {
        path.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }

    return path;
  };

  const path = buildPath(project);

  return (
    <div className="flex items-center gap-1 text-sm text-gray-600 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
      <button
        onClick={() => onProjectClick("")}
        className="text-blue-600 hover:text-blue-700 transition hover:underline"
      >
        Projects
      </button>

      {path.map((proj, index) => (
        <div key={proj.id} className="flex items-center gap-1">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {index === path.length - 1 ? (
            <span className="font-medium text-gray-900">{proj.name}</span>
          ) : (
            <button
              onClick={() => onProjectClick(proj.id)}
              className="text-blue-600 hover:text-blue-700 transition hover:underline"
            >
              {proj.name}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
