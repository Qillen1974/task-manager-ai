import { SubscriptionPlan } from "@prisma/client";

/**
 * Subscription plan limits for project hierarchy
 */
export const PROJECT_LIMITS = {
  FREE: {
    maxProjects: 3,
    maxProjectNestingLevel: 0, // No subprojects
    maxSubprojectsPerProject: 0,
    description: "Single-level projects only",
  },
  PRO: {
    maxProjects: 5,
    maxProjectNestingLevel: 1, // One level of nesting (projects + subprojects)
    maxSubprojectsPerProject: -1, // Unlimited subprojects per project
    description: "Up to 5 root projects with unlimited subprojects",
  },
  ENTERPRISE: {
    maxProjects: -1, // Unlimited
    maxProjectNestingLevel: -1, // Unlimited nesting
    maxSubprojectsPerProject: -1, // Unlimited subprojects
    description: "Unlimited projects with unlimited nesting",
  },
};

export const TASK_LIMITS = {
  FREE: {
    maxTasks: 50,
    description: "50 tasks per user",
  },
  PRO: {
    maxTasks: -1, // Unlimited
    description: "Unlimited tasks",
  },
  ENTERPRISE: {
    maxTasks: -1, // Unlimited
    description: "Unlimited tasks",
  },
};

/**
 * Get limits for a subscription plan
 */
export function getPlanLimits(plan: SubscriptionPlan) {
  return PROJECT_LIMITS[plan];
}

/**
 * Get task limits for a subscription plan
 */
export function getTaskLimitForPlan(plan: SubscriptionPlan) {
  return TASK_LIMITS[plan];
}

/**
 * Check if user can create a root project
 * @param plan - User's subscription plan
 * @param currentRootProjectCount - Current number of root projects user has
 * @returns Object with allowed boolean and message
 */
export function canCreateRootProject(
  plan: SubscriptionPlan,
  currentRootProjectCount: number
): { allowed: boolean; message?: string } {
  const limits = getPlanLimits(plan);

  // Unlimited projects for unlimited plans
  if (limits.maxProjects === -1) {
    return { allowed: true };
  }

  // Check if user has reached limit
  if (currentRootProjectCount >= limits.maxProjects) {
    return {
      allowed: false,
      message: `You have reached your project limit (${limits.maxProjects}) on the ${plan} plan. Upgrade to create more projects.`,
    };
  }

  return { allowed: true };
}

/**
 * Check if user can create a subproject
 * @param plan - User's subscription plan
 * @param parentProjectNestingLevel - Nesting level of parent project
 * @returns Object with allowed boolean and message
 */
export function canCreateSubproject(
  plan: SubscriptionPlan,
  parentProjectNestingLevel: number
): { allowed: boolean; message?: string } {
  const limits = getPlanLimits(plan);

  // Check nesting level
  if (limits.maxProjectNestingLevel === 0) {
    return {
      allowed: false,
      message: "Your current plan does not support subprojects. Upgrade to PRO to create subprojects.",
    };
  }

  // For limited nesting levels, check if we can nest deeper
  if (limits.maxProjectNestingLevel !== -1) {
    // Parent is at level 0, subproject will be at level 1
    const subprojectLevel = parentProjectNestingLevel + 1;
    if (subprojectLevel > limits.maxProjectNestingLevel) {
      return {
        allowed: false,
        message: `Your plan supports up to ${limits.maxProjectNestingLevel + 1} project levels. This would exceed that limit.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Get project path from root to current project
 * Used for breadcrumb navigation
 * @param projectName - Current project name
 * @param parentPath - Parent project path (empty string for root)
 * @returns Formatted project path
 */
export function getProjectPath(projectName: string, parentPath: string = ""): string {
  if (!parentPath) {
    return projectName;
  }
  return `${parentPath} > ${projectName}`;
}

/**
 * Calculate nesting level from parent
 * @param parentNestingLevel - Parent project's nesting level
 * @returns Nesting level for child project
 */
export function calculateChildNestingLevel(parentNestingLevel: number): number {
  return parentNestingLevel + 1;
}

/**
 * Get upgrade message based on what user is trying to do
 */
export function getUpgradeMessage(
  currentPlan: SubscriptionPlan,
  reason: "subprojects" | "more_projects"
): string {
  if (reason === "subprojects") {
    return `Upgrade to PRO to unlock subprojects and advanced project management.`;
  }
  if (reason === "more_projects") {
    return `Upgrade to PRO to create up to 5 projects, or ENTERPRISE for unlimited projects.`;
  }
  return `Upgrade your plan to unlock this feature.`;
}
