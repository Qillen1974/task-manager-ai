"use client";

import { Task, Project, TaskStatus } from "@/lib/types";
import { TaskCard } from "./TaskCard";

interface StatusAction {
  label: string;
  targetStatus: TaskStatus;
  className: string;
}

const STATUS_ACTIONS: Record<TaskStatus, StatusAction[]> = {
  TODO: [
    { label: "Start", targetStatus: "IN_PROGRESS", className: "bg-blue-600 hover:bg-blue-700 text-white" },
  ],
  IN_PROGRESS: [
    { label: "To Review", targetStatus: "REVIEW", className: "bg-amber-600 hover:bg-amber-700 text-white" },
    { label: "Back", targetStatus: "TODO", className: "bg-gray-200 hover:bg-gray-300 text-gray-700" },
  ],
  REVIEW: [
    { label: "Done", targetStatus: "DONE", className: "bg-green-600 hover:bg-green-700 text-white" },
    { label: "Rework", targetStatus: "IN_PROGRESS", className: "bg-gray-200 hover:bg-gray-300 text-gray-700" },
  ],
  TESTING: [
    { label: "Done", targetStatus: "DONE", className: "bg-green-600 hover:bg-green-700 text-white" },
    { label: "Rework", targetStatus: "IN_PROGRESS", className: "bg-gray-200 hover:bg-gray-300 text-gray-700" },
  ],
  DONE: [
    { label: "Reopen", targetStatus: "TODO", className: "bg-gray-200 hover:bg-gray-300 text-gray-700" },
  ],
};

const ENTERPRISE_STATUS_ACTIONS: Record<TaskStatus, StatusAction[]> = {
  ...STATUS_ACTIONS,
  REVIEW: [
    { label: "To Testing", targetStatus: "TESTING", className: "bg-purple-600 hover:bg-purple-700 text-white" },
    { label: "Rework", targetStatus: "IN_PROGRESS", className: "bg-gray-200 hover:bg-gray-300 text-gray-700" },
  ],
};

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  projects: Map<string, Project>;
  colorClass: string;
  isEnterprise?: boolean;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onTaskComplete: (taskId: string) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskAssign?: (task: Task) => void;
  onTaskViewDetails?: (task: Task) => void;
}

export function KanbanColumn({
  title,
  status,
  tasks,
  projects,
  colorClass,
  isEnterprise = false,
  onStatusChange,
  onTaskComplete,
  onTaskEdit,
  onTaskDelete,
  onTaskAssign,
  onTaskViewDetails,
}: KanbanColumnProps) {
  const actionsMap = isEnterprise ? ENTERPRISE_STATUS_ACTIONS : STATUS_ACTIONS;
  const actions = actionsMap[status];

  return (
    <div className={`flex flex-col rounded-xl border ${colorClass} min-h-[200px]`}>
      {/* Column Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm uppercase tracking-wide">{title}</h3>
        <span className="text-xs font-bold px-2 py-1 rounded-full bg-white bg-opacity-60">
          {tasks.length}
        </span>
      </div>

      {/* Task List */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[600px]">
        {tasks.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">No tasks</p>
        )}
        {tasks.map((task) => (
          <div key={task.id} className="space-y-2">
            <TaskCard
              task={task}
              project={projects.get(task.projectId)}
              onComplete={() => onTaskComplete(task.id)}
              onEdit={() => onTaskEdit(task)}
              onDelete={() => onTaskDelete(task.id)}
              onAssign={onTaskAssign ? () => onTaskAssign(task) : undefined}
              onViewDetails={onTaskViewDetails ? () => onTaskViewDetails(task) : undefined}
            />
            {/* Status transition buttons */}
            <div className="flex gap-2 px-1">
              {actions.map((action) => (
                <button
                  key={action.targetStatus}
                  onClick={() => onStatusChange(task.id, action.targetStatus)}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition ${action.className}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
