export type Priority = "urgent-important" | "not-urgent-important" | "urgent-not-important" | "not-urgent-not-important" | "";

export type RecurringPattern = "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";

export type TaskAssignmentRole = "OWNER" | "COLLABORATOR" | "REVIEWER";

export type SubscriptionPlan = "FREE" | "PRO" | "ENTERPRISE";

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  projectLimit: number;
  taskLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionLimits {
  canCreateRecurringTasks: boolean;
  recurringTaskLimit: number;
  currentRecurringTaskCount?: number;
  canCreateRootProject: boolean;
  rootProjectLimit: number;
  taskLimit: number;
  currentRootProjectCount?: number;
  canCreateSubproject: boolean;
  subprojectLevels: number;
  mobileUnlocked: boolean;
}

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
  isBetaTester?: boolean;
  betaJoinedAt?: string;
  mobileUnlocked?: boolean;
  createdAt: string;
  updatedAt: string;
  subscription?: Subscription;
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
  subscription: Subscription | null;
  subscriptionLimits: SubscriptionLimits | null;
  mobileSubscription: MobileSubscription | null;
}

// Mobile-specific subscription/unlock status
export interface MobileSubscription {
  // User status
  isBetaTester: boolean;
  betaJoinedAt: string | null;
  mobileUnlocked: boolean;

  // Beta mode status
  betaModeActive: boolean;

  // Computed access level
  hasPremiumAccess: boolean;
  accessReason: 'beta_mode' | 'purchased' | 'beta_reward' | 'free';

  // Limits
  limits: MobileLimits;

  // Current usage
  usage: {
    projectCount: number;
    activeTaskCount: number;
    recurringTaskCount: number;
  };

  // Computed limit status
  canCreateProject: boolean;
  canCreateTask: boolean;
  canCreateRecurringTask: boolean;
}

export interface MobileLimits {
  maxProjects: number; // -1 = unlimited
  maxTasks: number; // -1 = unlimited
  maxRecurringTasks: number; // -1 = unlimited
  aiButlerQueriesPerDay: number;
}
