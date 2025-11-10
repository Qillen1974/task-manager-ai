"use client";

import { Task, Project, TaskAssignment } from "@/lib/types";
import { formatDateTime, getPriorityBadgeColor, isOverdue, isDeadlineSoon, formatRecurringDescription } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  project?: Project;
  onComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAssign?: (task: Task) => void;
  showProject?: boolean;
}

export function TaskCard({ task, project, onComplete, onEdit, onDelete, onAssign, showProject = false }: TaskCardProps) {
  const isTaskOverdue = isOverdue(task.deadline);
  const isTaskSoon = isDeadlineSoon(task.deadline);

  return (
    <div
      className={`p-4 border rounded-lg transition ${
        task.completed ? "bg-gray-100 border-gray-300" : "bg-white border-gray-200 hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onComplete(task.id)}
          className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`font-semibold truncate ${task.completed ? "line-through text-gray-500" : "text-gray-900"}`}
            >
              {task.title}
            </h3>
            {showProject && project && (
              <span className={`text-xs px-2 py-1 rounded bg-${project.color}-100 text-${project.color}-800 whitespace-nowrap`}>
                {project.name}
              </span>
            )}
          </div>

          {task.description && (
            <p
              className={`text-sm mb-2 ${task.completed ? "text-gray-400" : "text-gray-600"}`}
            >
              {task.description}
            </p>
          )}

          <div className="flex items-center flex-wrap gap-2 mb-3">
            {/* Priority Badge */}
            <span className={`text-xs px-2 py-1 rounded font-medium ${getPriorityBadgeColor(task.priority)}`}>
              {task.priority.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
            </span>

            {/* Recurring Task Badge */}
            {task.isRecurring && (
              <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800 font-medium flex items-center gap-1" title={formatRecurringDescription(task.recurringPattern || "DAILY", task.recurringConfig)}>
                🔄 Recurring
              </span>
            )}

            {/* Start Date */}
            {task.startDate && (
              <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 font-medium">
                Starts: {formatDateTime(task.startDate, task.startTime)}
              </span>
            )}

            {/* Deadline */}
            {task.deadline && (
              <span
                className={`text-xs px-2 py-1 rounded ${
                  isTaskOverdue
                    ? "bg-red-100 text-red-800 font-medium"
                    : isTaskSoon
                      ? "bg-yellow-100 text-yellow-800 font-medium"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {formatDateTime(task.deadline, task.deadlineTime)}
                {isTaskOverdue && " (Overdue)"}
                {isTaskSoon && !isTaskOverdue && " (Soon)"}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-600">Progress:</span>
              <span className="text-xs font-semibold text-gray-700">{task.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${
                  task.progress === 0 ? "bg-gray-300" :
                  task.progress < 33 ? "bg-red-500" :
                  task.progress < 100 ? "bg-yellow-500" :
                  "bg-green-500"
                }`}
                style={{ width: `${task.progress || 0}%` }}
              />
            </div>
          </div>

          {/* Assignments */}
          {task.assignments && task.assignments.length > 0 && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium">Assigned to:</span>
              <div className="flex gap-2 flex-wrap">
                {task.assignments.map((assignment) => {
                  // Prefer firstName/email over name
                  const displayName = assignment.user?.firstName || assignment.user?.email || assignment.user?.name || assignment.userId;
                  const tooltipText = `${displayName} - ${assignment.role}`;

                  return (
                    <div
                      key={assignment.id}
                      className={`text-xs px-2 py-1 rounded font-medium cursor-help ${
                        assignment.role === "OWNER"
                          ? "bg-red-100 text-red-800"
                          : assignment.role === "COLLABORATOR"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                      }`}
                      title={tooltipText}
                    >
                      👤 {assignment.role}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dependencies and Resources */}
          <div className="flex flex-wrap gap-3 text-xs">
            {/* Task Dependencies */}
            {task.dependsOnTask && (
              <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded">
                <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 font-medium">
                  Depends on: <strong>{task.dependsOnTask.title}</strong>
                  {task.dependsOnTask.completed && <span className="text-green-600 ml-1">✓</span>}
                </span>
              </div>
            )}

            {/* Resource Allocation */}
            {task.resourceCount && task.resourceCount > 0 && (
              <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 font-medium">{task.resourceCount} resource{task.resourceCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            {task.manhours && task.manhours > 0 && (
              <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 font-medium">{task.manhours} hour{task.manhours !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 ml-2 flex-shrink-0">
          {onAssign && (
            <button
              onClick={() => onAssign(task)}
              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition"
              title="Assign task"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v2h8v-2zM16 11a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onEdit(task)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
            title="Edit task"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
            title="Delete task"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
