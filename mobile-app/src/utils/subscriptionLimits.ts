import { SubscriptionPlan, SubscriptionLimits } from '../types';

/**
 * Subscription plan limits for mobile app
 *
 * Tier Structure:
 * - FREE: 3 projects, 10 tasks, no recurring, no subprojects
 * - MOBILE_UNLOCK ($4.99 one-time): Unlimited projects/tasks, 10 recurring, 1 level subprojects
 * - PRO ($4.99/month): Same as Mobile Unlock + Mind Maps + Exports
 * - ENTERPRISE ($9.99/month): Unlimited everything + Teams
 */

type EffectiveTier = SubscriptionPlan | 'MOBILE_UNLOCK';

/**
 * Recurring task limits by plan
 */
const RECURRING_TASK_LIMITS: Record<EffectiveTier, { maxRecurringTasks: number; description: string }> = {
  FREE: {
    maxRecurringTasks: 0, // Disabled
    description: 'Recurring tasks not available',
  },
  MOBILE_UNLOCK: {
    maxRecurringTasks: 10,
    description: 'Up to 10 recurring task templates',
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
const PROJECT_LIMITS: Record<EffectiveTier, { maxProjects: number; maxProjectNestingLevel: number; description: string }> = {
  FREE: {
    maxProjects: 3,
    maxProjectNestingLevel: 0, // No subprojects
    description: 'Up to 3 projects only',
  },
  MOBILE_UNLOCK: {
    maxProjects: -1, // Unlimited
    maxProjectNestingLevel: 1, // One level of nesting
    description: 'Unlimited projects with one level of subprojects',
  },
  PRO: {
    maxProjects: -1, // Unlimited
    maxProjectNestingLevel: 1, // One level of nesting
    description: 'Unlimited projects with one level of subprojects',
  },
  ENTERPRISE: {
    maxProjects: -1, // Unlimited
    maxProjectNestingLevel: -1, // Unlimited nesting
    description: 'Unlimited projects with unlimited nesting',
  },
};

/**
 * Task limits by plan
 */
const TASK_LIMITS: Record<EffectiveTier, { maxTasks: number; description: string }> = {
  FREE: {
    maxTasks: 10,
    description: 'Up to 10 tasks',
  },
  MOBILE_UNLOCK: {
    maxTasks: -1, // Unlimited
    description: 'Unlimited tasks',
  },
  PRO: {
    maxTasks: -1, // Unlimited
    description: 'Unlimited tasks',
  },
  ENTERPRISE: {
    maxTasks: -1, // Unlimited
    description: 'Unlimited tasks',
  },
};

/**
 * Determine the effective tier for a user
 * Mobile Unlock takes precedence over FREE but not over PRO/ENTERPRISE
 */
export function getEffectiveTier(
  plan: SubscriptionPlan,
  mobileUnlocked: boolean
): EffectiveTier {
  // PRO and ENTERPRISE always take precedence
  if (plan === 'PRO' || plan === 'ENTERPRISE') {
    return plan;
  }
  // Mobile Unlock upgrades FREE users
  if (mobileUnlocked) {
    return 'MOBILE_UNLOCK';
  }
  return plan;
}

/**
 * Calculate subscription limits based on plan and mobile unlock status
 * @param plan - User's subscription plan
 * @param mobileUnlocked - Whether user has mobile unlock
 * @param currentRecurringTaskCount - Current number of recurring tasks (optional)
 * @returns SubscriptionLimits object
 */
export function calculateSubscriptionLimits(
  plan: SubscriptionPlan,
  mobileUnlocked: boolean = false,
  currentRecurringTaskCount?: number
): SubscriptionLimits {
  const tier = getEffectiveTier(plan, mobileUnlocked);
  const recurringLimits = RECURRING_TASK_LIMITS[tier];
  const projectLimits = PROJECT_LIMITS[tier];
  const taskLimits = TASK_LIMITS[tier];

  return {
    canCreateRecurringTasks: recurringLimits.maxRecurringTasks !== 0,
    recurringTaskLimit: recurringLimits.maxRecurringTasks,
    currentRecurringTaskCount,
    canCreateRootProject: true, // Can always create projects up to limit
    rootProjectLimit: projectLimits.maxProjects,
    taskLimit: taskLimits.maxTasks,
    canCreateSubproject: projectLimits.maxProjectNestingLevel !== 0, // -1 (unlimited) or > 0
    subprojectLevels: projectLimits.maxProjectNestingLevel,
    mobileUnlocked,
  };
}

/**
 * Check if user can create a recurring task
 * @param plan - User's subscription plan
 * @param currentRecurringTaskCount - Current number of recurring tasks
 * @param mobileUnlocked - Whether user has mobile unlock
 * @returns Object with allowed boolean and message
 */
export function canCreateRecurringTask(
  plan: SubscriptionPlan,
  currentRecurringTaskCount: number,
  mobileUnlocked: boolean = false
): { allowed: boolean; message?: string } {
  const tier = getEffectiveTier(plan, mobileUnlocked);
  const limits = RECURRING_TASK_LIMITS[tier];

  // Check if plan supports recurring tasks at all
  if (limits.maxRecurringTasks === 0) {
    return {
      allowed: false,
      message: 'Recurring tasks are not available on your current plan. Unlock for $4.99 to enable recurring tasks.',
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
      message: `You have reached your recurring task limit (${limits.maxRecurringTasks}). Upgrade to ENTERPRISE for unlimited recurring tasks.`,
    };
  }

  return { allowed: true };
}

/**
 * Check if user can create more tasks
 * @param plan - User's subscription plan
 * @param currentTaskCount - Current number of tasks
 * @param mobileUnlocked - Whether user has mobile unlock
 * @returns Object with allowed boolean and message
 */
export function canCreateTask(
  plan: SubscriptionPlan,
  currentTaskCount: number,
  mobileUnlocked: boolean = false
): { allowed: boolean; message?: string } {
  const tier = getEffectiveTier(plan, mobileUnlocked);
  const limits = TASK_LIMITS[tier];

  // Check if unlimited
  if (limits.maxTasks === -1) {
    return { allowed: true };
  }

  // Check if user has reached limit
  if (currentTaskCount >= limits.maxTasks) {
    return {
      allowed: false,
      message: `You have reached your task limit (${limits.maxTasks}). Unlock for $4.99 to create unlimited tasks.`,
    };
  }

  return { allowed: true };
}

/**
 * Check if user can create more projects
 * @param plan - User's subscription plan
 * @param currentProjectCount - Current number of projects
 * @param mobileUnlocked - Whether user has mobile unlock
 * @returns Object with allowed boolean and message
 */
export function canCreateProject(
  plan: SubscriptionPlan,
  currentProjectCount: number,
  mobileUnlocked: boolean = false
): { allowed: boolean; message?: string } {
  const tier = getEffectiveTier(plan, mobileUnlocked);
  const limits = PROJECT_LIMITS[tier];

  // Check if unlimited
  if (limits.maxProjects === -1) {
    return { allowed: true };
  }

  // Check if user has reached limit
  if (currentProjectCount >= limits.maxProjects) {
    return {
      allowed: false,
      message: `You have reached your project limit (${limits.maxProjects}). Unlock for $4.99 to create unlimited projects.`,
    };
  }

  return { allowed: true };
}
