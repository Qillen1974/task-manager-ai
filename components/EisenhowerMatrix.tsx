"use client";

import { Task, Project, Priority } from "@/lib/types";
import { TaskCard } from "./TaskCard";
import { filterTasksByPriority } from "@/lib/utils";

interface EisenhowerMatrixProps {
  tasks: Task[];
  projects: Map<string, Project>;
  onTaskComplete: (taskId: string) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
}

const quadrants: Array<{
  priority: Priority;
  title: string;
  subtitle: string;
  bgColor: string;
  borderColor: string;
}> = [
  {
    priority: "urgent-important",
    title: "Quadrant I",
    subtitle: "Urgent & Important",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  {
    priority: "not-urgent-important",
    title: "Quadrant II",
    subtitle: "Not Urgent & Important",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    priority: "urgent-not-important",
    title: "Quadrant III",
    subtitle: "Urgent & Not Important",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  {
    priority: "not-urgent-not-important",
    title: "Quadrant IV",
    subtitle: "Not Urgent & Not Important",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
];

export function EisenhowerMatrix({
  tasks,
  projects,
  onTaskComplete,
  onTaskEdit,
  onTaskDelete,
}: EisenhowerMatrixProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {quadrants.map((quadrant) => {
        const quadrantTasks = filterTasksByPriority(tasks, quadrant.priority).filter((t) => !t.completed);
        const completedCount = filterTasksByPriority(tasks, quadrant.priority).filter((t) => t.completed).length;

        return (
          <div
            key={quadrant.priority}
            className={`border-2 rounded-lg p-6 ${quadrant.bgColor} ${quadrant.borderColor}`}
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">{quadrant.title}</h3>
              <p className="text-sm text-gray-600">{quadrant.subtitle}</p>
              <p className="text-xs text-gray-500 mt-2">
                {quadrantTasks.length} active • {completedCount} completed
              </p>
            </div>

            <div className="space-y-3">
              {quadrantTasks.length > 0 ? (
                quadrantTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    project={projects.get(task.projectId)}
                    onComplete={onTaskComplete}
                    onEdit={onTaskEdit}
                    onDelete={onTaskDelete}
                    showProject
                  />
                ))
              ) : (
                <p className="text-center text-gray-400 py-8">No tasks in this quadrant</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
