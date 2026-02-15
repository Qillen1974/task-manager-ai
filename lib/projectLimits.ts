import { SubscriptionPlan } from "@prisma/client";

/**
 * Subscription plan limits for project hierarchy
 *
 * Tier Structure:
 * - FREE: 3 projects, 10 tasks, no recurring, no subprojects
 * - MOBILE_UNLOCK ($4.99 one-time): Unlimited projects/tasks, 10 recurring, 1 level subprojects
 * - PRO ($4.99/month): Same as Mobile Unlock + Mind Maps + Exports
 * - ENTERPRISE ($9.99/month): Unlimited everything + Teams
 */
export const PROJECT_LIMITS = {
  FREE: {
    maxProjects: 3,
    maxProjectNestingLevel: 0, // No subprojects
    maxSubprojectsPerProject: 0,
    description: "Up to 3 projects only",
  },
  // Mobile Unlock uses same limits as PRO for projects
  MOBILE_UNLOCK: {
    maxProjects: -1, // Unlimited
    maxProjectNestingLevel: 1, // One level of nesting (projects + subprojects)
    maxSubprojectsPerProject: -1, // Unlimited subprojects per project
    description: "Unlimited projects with one level of subprojects",
  },
  PRO: {
    maxProjects: -1, // Unlimited
    maxProjectNestingLevel: 1, // One level of nesting (projects + subprojects)
    maxSubprojectsPerProject: -1, // Unlimited subprojects per project
    description: "Unlimited projects with one level of subprojects",
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
    maxTasks: 10,
    description: "Up to 10 tasks",
  },
  MOBILE_UNLOCK: {
    maxTasks: -1, // Unlimited
    description: "Unlimited tasks",
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

export const RECURRING_TASK_LIMITS = {
  FREE: {
    maxRecurringTasks: 0, // Disabled
    description: "Recurring tasks not available",
  },
  MOBILE_UNLOCK: {
    maxRecurringTasks: 10,
    description: "Up to 10 recurring task templates",
  },
  PRO: {
    maxRecurringTasks: 10,
    description: "Up to 10 recurring task templates",
  },
  ENTERPRISE: {
    maxRecurringTasks: -1, // Unlimited
    description: "Unlimited recurring task templates",
  },
};

/**
 * Mind mapping feature limits
 * Mind maps can be created by PRO and ENTERPRISE users only
 * Mobile Unlock does NOT include mind maps
 */
export const MIND_MAP_LIMITS = {
  FREE: {
    maxMindMaps: 0, // Disabled
    maxNodesPerMindMap: 0,
    description: "Mind mapping not available",
  },
  MOBILE_UNLOCK: {
    maxMindMaps: 0, // Disabled - Mind maps are PRO+ feature
    maxNodesPerMindMap: 0,
    description: "Mind mapping not available - upgrade to PRO",
  },
  PRO: {
    maxMindMaps: 5,
    maxNodesPerMindMap: 50,
    description: "Up to 5 mind maps with 50 nodes each",
  },
  ENTERPRISE: {
    maxMindMaps: -1, // Unlimited
    maxNodesPerMindMap: -1, // Unlimited
    description: "Unlimited mind maps with unlimited nodes",
  },
};

/**
 * Effective tier type that includes Mobile Unlock
 */
export type EffectiveTier = SubscriptionPlan | "MOBILE_UNLOCK";

/**
 * Determine the effective tier for a user
 * Mobile Unlock takes precedence over FREE but not over PRO/ENTERPRISE
 * @param plan - User's subscription plan
 * @param mobileUnlocked - Whether user has purchased mobile unlock
 * @returns Effective tier for limit calculations
 */
export function getEffectiveTier(
  plan: SubscriptionPlan,
  mobileUnlocked: boolean
): EffectiveTier {
  // PRO and ENTERPRISE always take precedence
  if (plan === "PRO" || plan === "ENTERPRISE") {
    return plan;
  }
  // Mobile Unlock upgrades FREE users
  if (mobileUnlocked) {
    return "MOBILE_UNLOCK";
  }
  return plan;
}

/**
 * Get limits for a user considering mobile unlock status
 */
export function getEffectiveLimits(
  plan: SubscriptionPlan,
  mobileUnlocked: boolean
): {
  projectLimit: number;
  taskLimit: number;
  recurringTaskLimit: number;
  maxProjectNestingLevel: number;
  canUseMindMaps: boolean;
  mindMapLimit: number;
} {
  const tier = getEffectiveTier(plan, mobileUnlocked);
  const projectLimits = PROJECT_LIMITS[tier];
  const taskLimits = TASK_LIMITS[tier];
  const recurringLimits = RECURRING_TASK_LIMITS[tier];
  const mindMapLimits = MIND_MAP_LIMITS[tier];

  return {
    projectLimit: projectLimits.maxProjects,
    taskLimit: taskLimits.maxTasks,
    recurringTaskLimit: recurringLimits.maxRecurringTasks,
    maxProjectNestingLevel: projectLimits.maxProjectNestingLevel,
    canUseMindMaps: mindMapLimits.maxMindMaps !== 0,
    mindMapLimit: mindMapLimits.maxMindMaps,
  };
}

/**
 * Get limits for a subscription plan (or effective tier)
 */
export function getPlanLimits(plan: EffectiveTier) {
  return PROJECT_LIMITS[plan];
}

/**
 * Get task limits for a subscription plan (or effective tier)
 */
export function getTaskLimitForPlan(plan: EffectiveTier) {
  return TASK_LIMITS[plan];
}

/**
 * Check if user can create a root project
 * @param plan - User's subscription plan
 * @param currentRootProjectCount - Current number of root projects user has
 * @param mobileUnlocked - Whether user has mobile unlock
 * @returns Object with allowed boolean and message
 */
export function canCreateRootProject(
  plan: SubscriptionPlan,
  currentRootProjectCount: number,
  mobileUnlocked: boolean = false
): { allowed: boolean; message?: string } {
  const tier = getEffectiveTier(plan, mobileUnlocked);
  const limits = getPlanLimits(tier);

  // Unlimited projects for unlimited plans
  if (limits.maxProjects === -1) {
    return { allowed: true };
  }

  // Check if user has reached limit
  if (currentRootProjectCount >= limits.maxProjects) {
    return {
      allowed: false,
      message: `You have reached your project limit (${limits.maxProjects}). Upgrade to create more projects.`,
    };
  }

  return { allowed: true };
}

/**
 * Check if user can create a subproject
 * @param plan - User's subscription plan
 * @param parentProjectNestingLevel - Nesting level of parent project
 * @param mobileUnlocked - Whether user has mobile unlock
 * @returns Object with allowed boolean and message
 */
export function canCreateSubproject(
  plan: SubscriptionPlan,
  parentProjectNestingLevel: number,
  mobileUnlocked: boolean = false
): { allowed: boolean; message?: string } {
  const tier = getEffectiveTier(plan, mobileUnlocked);
  const limits = getPlanLimits(tier);

  // Check nesting level
  if (limits.maxProjectNestingLevel === 0) {
    return {
      allowed: false,
      message: "Your current plan does not support subprojects. Upgrade to unlock subprojects.",
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
 * Get recurring task limits for a subscription plan (or effective tier)
 */
export function getRecurringTaskLimit(plan: EffectiveTier) {
  return RECURRING_TASK_LIMITS[plan];
}

/**
 * Check if user can create a recurring task
 * @param plan - User's subscription plan
 * @param currentRecurringTaskCount - Current number of recurring tasks user has
 * @param mobileUnlocked - Whether user has mobile unlock
 * @returns Object with allowed boolean and message
 */
export function canCreateRecurringTask(
  plan: SubscriptionPlan,
  currentRecurringTaskCount: number,
  mobileUnlocked: boolean = false
): { allowed: boolean; message?: string } {
  const tier = getEffectiveTier(plan, mobileUnlocked);
  const limits = getRecurringTaskLimit(tier);

  // Check if plan supports recurring tasks at all
  if (limits.maxRecurringTasks === 0) {
    return {
      allowed: false,
      message: "Recurring tasks are not available on your current plan. Upgrade to unlock recurring tasks.",
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
 * Check if user's plan supports the Kanban board feature
 * Kanban board is an ENTERPRISE-only feature
 */
export function canAccessKanban(plan: SubscriptionPlan): boolean {
  return plan === "ENTERPRISE";
}

/**
 * Get upgrade message based on what user is trying to do
 */
export function getUpgradeMessage(
  currentPlan: SubscriptionPlan,
  reason: "subprojects" | "more_projects" | "recurring_tasks" | "mind_maps",
  mobileUnlocked: boolean = false
): string {
  const tier = getEffectiveTier(currentPlan, mobileUnlocked);

  if (reason === "subprojects") {
    if (tier === "FREE") {
      return `Unlock for $4.99 to enable subprojects and unlimited projects.`;
    }
    return `Upgrade to PRO to unlock deeper project nesting.`;
  }
  if (reason === "more_projects") {
    if (tier === "FREE") {
      return `Unlock for $4.99 to create unlimited projects.`;
    }
    return `Upgrade to ENTERPRISE for unlimited projects.`;
  }
  if (reason === "recurring_tasks") {
    if (tier === "FREE") {
      return `Unlock for $4.99 to enable recurring tasks.`;
    }
    return `Upgrade to ENTERPRISE for unlimited recurring tasks.`;
  }
  if (reason === "mind_maps") {
    return `Upgrade to PRO to unlock mind mapping features.`;
  }
  return `Upgrade your plan to unlock this feature.`;
}

/**
 * Get correct subscription limits for a plan considering mobile unlock
 * Converts -1 (unlimited) to 999999 for display purposes
 */
export function getCorrectLimitsForPlan(
  plan: string,
  mobileUnlocked: boolean = false
): {
  projectLimit: number;
  taskLimit: number;
} {
  const tier = getEffectiveTier(plan as SubscriptionPlan, mobileUnlocked);
  const projectLimitValue = PROJECT_LIMITS[tier];
  const taskLimitValue = TASK_LIMITS[tier];

  if (!projectLimitValue || !taskLimitValue) {
    // Default to FREE plan if invalid plan
    return {
      projectLimit: PROJECT_LIMITS.FREE.maxProjects,
      taskLimit: TASK_LIMITS.FREE.maxTasks,
    };
  }

  return {
    projectLimit: projectLimitValue.maxProjects === -1 ? 999999 : projectLimitValue.maxProjects,
    taskLimit: taskLimitValue.maxTasks === -1 ? 999999 : taskLimitValue.maxTasks,
  };
}

/**
 * Get mind map limits for a subscription plan (or effective tier)
 * Note: Mobile Unlock does NOT include mind maps
 */
export function getMindMapLimit(plan: EffectiveTier) {
  return MIND_MAP_LIMITS[plan];
}

/**
 * Check if user can create a mind map
 * @param plan - User's subscription plan
 * @param currentMindMapCount - Current number of mind maps user has
 * @param mobileUnlocked - Whether user has mobile unlock (does NOT grant mind map access)
 * @returns Object with allowed boolean and message
 */
export function canCreateMindMap(
  plan: SubscriptionPlan,
  currentMindMapCount: number,
  mobileUnlocked: boolean = false
): { allowed: boolean; message?: string } {
  // Mind maps are only available on PRO and ENTERPRISE, not Mobile Unlock
  const tier = getEffectiveTier(plan, mobileUnlocked);
  const limits = getMindMapLimit(tier);

  // Check if plan supports mind maps at all
  if (limits.maxMindMaps === 0) {
    return {
      allowed: false,
      message: "Mind mapping is not available on your current plan. Upgrade to PRO ($4.99/month) to create mind maps.",
    };
  }

  // Check if unlimited
  if (limits.maxMindMaps === -1) {
    return { allowed: true };
  }

  // Check if user has reached limit
  if (currentMindMapCount >= limits.maxMindMaps) {
    return {
      allowed: false,
      message: `You have reached your mind map limit (${limits.maxMindMaps}). Upgrade to ENTERPRISE for unlimited mind maps.`,
    };
  }

  return { allowed: true };
}

/**
 * Check if a mind map can have a certain number of nodes
 * @param plan - User's subscription plan
 * @param nodeCount - Number of nodes in the mind map
 * @param mobileUnlocked - Whether user has mobile unlock (does NOT grant mind map access)
 * @returns Object with allowed boolean and message
 */
export function canCreateMindMapWithNodes(
  plan: SubscriptionPlan,
  nodeCount: number,
  mobileUnlocked: boolean = false
): { allowed: boolean; message?: string } {
  const tier = getEffectiveTier(plan, mobileUnlocked);
  const limits = getMindMapLimit(tier);

  // Check if plan supports mind maps at all
  if (limits.maxMindMaps === 0) {
    return {
      allowed: false,
      message: "Mind mapping is not available on your current plan. Upgrade to PRO ($4.99/month) to create mind maps.",
    };
  }

  // Check if unlimited
  if (limits.maxNodesPerMindMap === -1) {
    return { allowed: true };
  }

  // Check if node count exceeds limit
  if (nodeCount > limits.maxNodesPerMindMap) {
    return {
      allowed: false,
      message: `Your mind map exceeds the node limit (${limits.maxNodesPerMindMap}). Upgrade to ENTERPRISE for unlimited nodes per mind map.`,
    };
  }

  return { allowed: true };
}
