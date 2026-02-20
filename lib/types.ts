export type Priority = "urgent-important" | "not-urgent-important" | "urgent-not-important" | "not-urgent-not-important" | "";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "TESTING" | "DONE";

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
  interval: number; // Every X days/weeks/months
  daysOfWeek?: number[]; // For WEEKLY: 0-6 (Sunday=0, Saturday=6)
  dayOfMonth?: number; // For MONTHLY: 1-31
  customType?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"; // For CUSTOM pattern
  endAfterOccurrences?: number; // Stop after N occurrences
  endDate?: string; // Stop on specific date (YYYY-MM-DD)
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
  progress?: number; // Task progress percentage (0-100)
  status?: TaskStatus; // Kanban workflow status
  startDate?: string;
  startTime?: string;
  resourceCount?: number; // Number of people assigned to task
  manhours?: number; // Total manhours allocated to task
  dependsOnTaskId?: string; // ID of the task this task depends on
  dependsOnTask?: Task; // The task this task depends on (optional, for display)
  // Recurring task fields
  isRecurring?: boolean; // Whether this is a recurring task template
  recurringPattern?: RecurringPattern; // Pattern type
  recurringConfig?: RecurringConfig | string; // Pattern configuration (can be JSON string or object)
  recurringStartDate?: string; // When recurrence should start
  recurringEndDate?: string; // When recurrence should stop
  nextGenerationDate?: string; // When next instance should be generated
  lastGeneratedDate?: string; // When last instance was generated
  parentTaskId?: string; // Reference to parent recurring task
  // Subtask hierarchy
  subtaskOfId?: string; // Reference to parent task (subtask of)
  subtaskCount?: number; // Number of subtasks
  subtasks?: Task[]; // Subtask list
  createdAt: string;
  updatedAt: string;
  // Bot assignment
  assignedToBotId?: string; // Bot assigned to this task
  assignedToBot?: { id: string; name: string }; // Bot info for display
  // Task assignments
  assignments?: TaskAssignment[]; // Team members assigned to this task
  userId?: string; // Creator of the task
  project?: Project; // Project this task belongs to
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  teamId?: string; // Team ID if this is a team project
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  body: string;
  metadata?: any;
  author: {
    type: "bot" | "user" | "unknown";
    id?: string;
    name?: string;
  };
  createdAt: string;
}

export interface TaskArtifact {
  id: string;
  taskId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  author: {
    type: "bot" | "user";
    name: string;
  };
  createdAt: string;
}

export interface AppState {
  projects: Project[];
  tasks: Task[];
}
