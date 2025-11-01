import { Task, Priority } from "./types";

export function getPriorityLabel(priority: Priority): string {
  const labels: Record<Exclude<Priority, "">, string> = {
    "urgent-important": "Urgent & Important",
    "not-urgent-important": "Not Urgent & Important",
    "urgent-not-important": "Urgent & Not Important",
    "not-urgent-not-important": "Not Urgent & Not Important",
  };
  return priority === "" ? "No Quadrant" : labels[priority as Exclude<Priority, "">];
}

export function getPriorityColor(priority: Priority): string {
  const colors: Record<Exclude<Priority, "">, string> = {
    "urgent-important": "bg-red-50 border-red-200",
    "not-urgent-important": "bg-blue-50 border-blue-200",
    "urgent-not-important": "bg-yellow-50 border-yellow-200",
    "not-urgent-not-important": "bg-gray-50 border-gray-200",
  };
  return priority === "" ? "bg-gray-50 border-gray-200" : colors[priority as Exclude<Priority, "">];
}

export function getPriorityBadgeColor(priority: Priority): string {
  const colors: Record<Exclude<Priority, "">, string> = {
    "urgent-important": "bg-red-100 text-red-800",
    "not-urgent-important": "bg-blue-100 text-blue-800",
    "urgent-not-important": "bg-yellow-100 text-yellow-800",
    "not-urgent-not-important": "bg-gray-100 text-gray-800",
  };
  return priority === "" ? "bg-gray-100 text-gray-800" : colors[priority as Exclude<Priority, "">];
}

export function getPriorityQuadrant(priority: Priority): string {
  const quadrants: Record<Exclude<Priority, "">, string> = {
    "urgent-important": "Quadrant I",
    "not-urgent-important": "Quadrant II",
    "urgent-not-important": "Quadrant III",
    "not-urgent-not-important": "Quadrant IV",
  };
  return priority === "" ? "None" : quadrants[priority as Exclude<Priority, "">];
}

export function isDeadlineSoon(deadline?: string): boolean {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 3;
}

export function isOverdue(deadline?: string): boolean {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return deadlineDate < today;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return "No deadline";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(date?: string, time?: string): string {
  if (!date) return "No deadline";
  let result = formatDate(date);
  if (time) {
    result += ` at ${time}`;
  }
  return result;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function filterTasksByPriority(tasks: Task[], priority: Priority): Task[] {
  return tasks.filter((task) => task.priority === priority);
}

export function getTasksByProject(tasks: Task[], projectId: string): Task[] {
  return tasks.filter((task) => task.projectId === projectId);
}

export function getCompletedTaskCount(tasks: Task[]): number {
  return tasks.filter((task) => task.completed).length;
}

export function getPendingTaskCount(tasks: Task[]): number {
  return tasks.filter((task) => !task.completed).length;
}
