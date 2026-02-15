"use client";

import { useMemo } from "react";
import { Task, Project, TaskStatus } from "@/lib/types";
import { KanbanColumn } from "./KanbanColumn";

interface KanbanBoardProps {
  tasks: Task[];
  projects: Map<string, Project>;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onTaskComplete: (taskId: string) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskAssign?: (task: Task) => void;
  onTaskViewDetails?: (task: Task) => void;
}

/** Derive status for legacy tasks that don't have one yet */
function deriveStatus(task: Task): TaskStatus {
  if (task.status) return task.status;
  if (task.completed) return "DONE";
  if (task.progress && task.progress > 0) return "IN_PROGRESS";
  return "TODO";
}

const COLUMNS: { title: string; status: TaskStatus; colorClass: string }[] = [
  { title: "To Do", status: "TODO", colorClass: "border-slate-200 bg-slate-50" },
  { title: "In Progress", status: "IN_PROGRESS", colorClass: "border-blue-200 bg-blue-50" },
  { title: "Review", status: "REVIEW", colorClass: "border-amber-200 bg-amber-50" },
  { title: "Done", status: "DONE", colorClass: "border-green-200 bg-green-50" },
];

export function KanbanBoard({
  tasks,
  projects,
  onStatusChange,
  onTaskComplete,
  onTaskEdit,
  onTaskDelete,
  onTaskAssign,
  onTaskViewDetails,
}: KanbanBoardProps) {
  const tasksByStatus = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      TODO: [],
      IN_PROGRESS: [],
      REVIEW: [],
      DONE: [],
    };
    for (const task of tasks) {
      const status = deriveStatus(task);
      groups[status].push(task);
    }
    return groups;
  }, [tasks]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map((col) => (
        <KanbanColumn
          key={col.status}
          title={col.title}
          status={col.status}
          tasks={tasksByStatus[col.status]}
          projects={projects}
          colorClass={col.colorClass}
          onStatusChange={onStatusChange}
          onTaskComplete={onTaskComplete}
          onTaskEdit={onTaskEdit}
          onTaskDelete={onTaskDelete}
          onTaskAssign={onTaskAssign}
          onTaskViewDetails={onTaskViewDetails}
        />
      ))}
    </div>
  );
}
