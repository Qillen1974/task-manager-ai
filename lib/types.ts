export type Priority = "urgent-important" | "not-urgent-important" | "urgent-not-important" | "not-urgent-not-important" | "";

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  priority?: Priority;
  dueDate?: string;
  dueTime?: string;
  completed: boolean;
  completedAt?: string;
  progress?: number; // Task progress percentage (0-100)
  startDate?: string;
  startTime?: string;
  resourceCount?: number; // Number of people assigned to task
  manhours?: number; // Total manhours allocated to task
  dependsOnTaskId?: string; // ID of the task this task depends on
  dependsOnTask?: Task; // The task this task depends on (optional, for display)
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  projects: Project[];
  tasks: Task[];
}
