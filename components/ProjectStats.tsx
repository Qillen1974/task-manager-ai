"use client";

import { Project } from "@/lib/types";

interface ProjectStatsProps {
  project: Project;
  tasks: any[]; // Task array
  childProjects?: Project[];
  onEditProject?: () => void;
}

export function ProjectStats({
  project,
  tasks,
  childProjects = [],
  onEditProject,
}: ProjectStatsProps) {
  // Calculate task statistics
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.completed).length,
    pending: tasks.filter((t) => !t.completed).length,
    completionRate: tasks.length > 0 ? Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100) : 0,
  };

  // Calculate timeline
  const today = new Date();
  const startDate = project.startDate ? new Date(project.startDate) : null;
  const endDate = project.endDate ? new Date(project.endDate) : null;

  const getTimelineStatus = () => {
    if (!startDate || !endDate) return "No timeline";

    if (today < startDate) {
      const daysUntilStart = Math.ceil(
        (startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return `Starts in ${daysUntilStart} days`;
    }

    if (today > endDate) {
      const daysOverdue = Math.ceil(
        (today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return `Overdue by ${daysOverdue} days`;
    }

    const daysRemaining = Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return `${daysRemaining} days remaining`;
  };

  const getTimelineColor = () => {
    if (!endDate) return "text-gray-500";

    if (today > endDate) return "text-red-600";
    if (today > new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)) return "text-yellow-600";
    return "text-green-600";
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="text-gray-600 mt-2">{project.description}</p>
          )}
        </div>
        {onEditProject && (
          <button
            onClick={onEditProject}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
          >
            Edit Project
          </button>
        )}
      </div>

      {/* Project Status and Owner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Status</p>
          <p className="text-lg font-semibold text-gray-900">
            {project.status ? project.status.charAt(0) + project.status.slice(1).toLowerCase() : "Active"}
          </p>
        </div>

        {/* Owner */}
        {project.owner && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Project Owner</p>
            <p className="text-lg font-semibold text-gray-900">{project.owner}</p>
          </div>
        )}

        {/* Budget */}
        {project.budget && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Budget</p>
            <p className="text-lg font-semibold text-gray-900">
              {project.budget_currency} {project.budget.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Timeline */}
      {(project.startDate || project.endDate) && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Timeline</h3>
          <div className="space-y-2">
            {project.startDate && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Start Date:</span>
                <span className="font-medium text-gray-900">{formatDate(new Date(project.startDate))}</span>
              </div>
            )}
            {project.endDate && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">End Date:</span>
                <span className="font-medium text-gray-900">{formatDate(new Date(project.endDate))}</span>
              </div>
            )}
            <div className={`flex justify-between items-center pt-2 border-t border-gray-200 ${getTimelineColor()}`}>
              <span className="text-gray-600">Status:</span>
              <span className="font-medium">{getTimelineStatus()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Task Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-2">Total Tasks</p>
          <p className="text-3xl font-bold text-gray-900">{taskStats.total}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-2">Completed</p>
          <p className="text-3xl font-bold text-green-600">{taskStats.completed}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-2">Pending</p>
          <p className="text-3xl font-bold text-blue-600">{taskStats.pending}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-2">Completion</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold text-gray-900">{taskStats.completionRate}%</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${taskStats.completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Child Projects */}
      {childProjects.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Subprojects</h3>
          <div className="space-y-2">
            {childProjects.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: child.color || "#3b82f6" }}
                  />
                  <span className="text-gray-900 font-medium">{child.name}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {(child as any).taskCount || 0} tasks
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
