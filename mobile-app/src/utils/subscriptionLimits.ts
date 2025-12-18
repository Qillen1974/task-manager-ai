import { SubscriptionPlan, SubscriptionLimits } from '../types';

/**
 * Recurring task limits by plan
 */
const RECURRING_TASK_LIMITS = {
  FREE: {
    maxRecurringTasks: 0, // Disabled
    description: 'Recurring tasks not available',
  },
  PRO: {
    maxRecurringTasks: 10,
    description: 'Up to 10 recurring task templates',
  },
  ENTERPRISE: {
    maxRecurringTasks: -1, // Unlimited
    description: 'Unlimited recurring task templates',
  },
};

/**
 * Project limits by plan
 */
const PROJECT_LIMITS = {
  FREE: {
    maxProjects: 10,
    maxProjectNestingLevel: 0, // No subprojects
    description: 'Single-level projects only',
  },
  PRO: {
    maxProjects: 30,
    maxProjectNestingLevel: 1, // One level of nesting
    description: 'Up to 30 root projects with unlimited subprojects',
  },
  ENTERPRISE: {
    maxProjects: -1, // Unlimited
    maxProjectNestingLevel: -1, // Unlimited nesting
    description: 'Unlimited projects with unlimited nesting',
  },
};

/**
 * Calculate subscription limits based on plan
 * @param plan - User's subscription plan
 * @param currentRecurringTaskCount - Current number of recurring tasks (optional)
 * @returns SubscriptionLimits object
 */
export function calculateSubscriptionLimits(
  plan: SubscriptionPlan,
  currentRecurringTaskCount?: number
): SubscriptionLimits {
  const recurringLimits = RECURRING_TASK_LIMITS[plan];
  const projectLimits = PROJECT_LIMITS[plan];

  return {
    canCreateRecurringTasks: recurringLimits.maxRecurringTasks !== 0,
    recurringTaskLimit: recurringLimits.maxRecurringTasks,
    currentRecurringTaskCount,
    canCreateRootProject: true, // Can always create projects up to limit
    rootProjectLimit: projectLimits.maxProjects,
    canCreateSubproject: projectLimits.maxProjectNestingLevel !== 0, // -1 (unlimited) or > 0
    subprojectLevels: projectLimits.maxProjectNestingLevel,
  };
}

/**
 * Check if user can create a recurring task
 * @param plan - User's subscription plan
 * @param currentRecurringTaskCount - Current number of recurring tasks
 * @returns Object with allowed boolean and message
 */
export function canCreateRecurringTask(
  plan: SubscriptionPlan,
  currentRecurringTaskCount: number
): { allowed: boolean; message?: string } {
  const limits = RECURRING_TASK_LIMITS[plan];

  // Check if plan supports recurring tasks at all
  if (limits.maxRecurringTasks === 0) {
    return {
      allowed: false,
      message: 'Recurring tasks are not available on your current plan. Upgrade to PRO to create recurring tasks.',
    };
  }

  // Check if unlimited
  if (limits.maxRecurringTasks === -1) {
    return { allowed: true };
  }

  // Check if user has reached limit
  if (currentRecurringTaskCount >= limits.maxRecurringTasks) {
    return {
      allowed: false,
      message: `You have reached your recurring task limit (${limits.maxRecurringTasks}) on the ${plan} plan. Upgrade to ENTERPRISE for unlimited recurring tasks.`,
    };
  }

  return { allowed: true };
}
