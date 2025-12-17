export type Priority = "urgent-important" | "not-urgent-important" | "urgent-not-important" | "not-urgent-not-important" | "";

export type RecurringPattern = "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";

export type TaskAssignmentRole = "OWNER" | "COLLABORATOR" | "REVIEWER";

export interface TaskAssignment {
  id: string;
  userId: string;
  role: TaskAssignmentRole;
  createdAt: string;
  user?: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  };
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringConfig {
  pattern: RecurringPattern;
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  customType?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  endAfterOccurrences?: number;
  endDate?: string;
}

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
  progress?: number;
  startDate?: string;
  startTime?: string;
  resourceCount?: number;
  manhours?: number;
  dependsOnTaskId?: string;
  dependsOnTask?: Task;
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  recurringConfig?: RecurringConfig | string;
  recurringStartDate?: string;
  recurringEndDate?: string;
  nextGenerationDate?: string;
  lastGeneratedDate?: string;
  parentTaskId?: string;
  createdAt: string;
  updatedAt: string;
  assignments?: TaskAssignment[];
  userId?: string;
  project?: Project;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  teamId?: string;
  parentProjectId?: string;
  projectLevel?: number;
  children?: Project[];
  taskCount?: number;
  completedCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}
