"use client";

import { Task, Project } from "@/lib/types";
import { formatDateTime, getPriorityBadgeColor, isOverdue, isDeadlineSoon } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  project?: Project;
  onComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  showProject?: boolean;
}

export function TaskCard({ task, project, onComplete, onEdit, onDelete, showProject = false }: TaskCardProps) {
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

          <div className="flex items-center flex-wrap gap-2">
            {/* Priority Badge */}
            <span className={`text-xs px-2 py-1 rounded font-medium ${getPriorityBadgeColor(task.priority)}`}>
              {task.priority.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
            </span>

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
        </div>

        {/* Actions */}
        <div className="flex gap-1 ml-2 flex-shrink-0">
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
