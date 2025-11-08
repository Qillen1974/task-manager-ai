import { SubscriptionPlan } from "@prisma/client";

/**
 * Subscription plan limits for project hierarchy
 */
export const PROJECT_LIMITS = {
  FREE: {
    maxProjects: 10,
    maxProjectNestingLevel: 0, // No subprojects
    maxSubprojectsPerProject: 0,
    description: "Single-level projects only",
  },
  PRO: {
    maxProjects: 30,
    maxProjectNestingLevel: 1, // One level of nesting (projects + subprojects)
    maxSubprojectsPerProject: -1, // Unlimited subprojects per project
    description: "Up to 30 root projects with unlimited subprojects",
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
    maxTasks: 200,
    description: "Up to 200 tasks",
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
 * Mind maps can be created by PRO and ENTERPRISE users
 */
export const MIND_MAP_LIMITS = {
  FREE: {
    maxMindMaps: 0, // Disabled
    maxNodesPerMindMap: 0,
    description: "Mind mapping not available",
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
 * Get recurring task limits for a subscription plan
 */
export function getRecurringTaskLimit(plan: SubscriptionPlan) {
  return RECURRING_TASK_LIMITS[plan];
}

/**
 * Check if user can create a recurring task
 * @param plan - User's subscription plan
 * @param currentRecurringTaskCount - Current number of recurring tasks user has
 * @returns Object with allowed boolean and message
 */
export function canCreateRecurringTask(
  plan: SubscriptionPlan,
  currentRecurringTaskCount: number
): { allowed: boolean; message?: string } {
  const limits = getRecurringTaskLimit(plan);

  // Check if plan supports recurring tasks at all
  if (limits.maxRecurringTasks === 0) {
    return {
      allowed: false,
      message: "Recurring tasks are not available on your current plan. Upgrade to PRO to create recurring tasks.",
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

/**
 * Get upgrade message based on what user is trying to do
 */
export function getUpgradeMessage(
  currentPlan: SubscriptionPlan,
  reason: "subprojects" | "more_projects" | "recurring_tasks"
): string {
  if (reason === "subprojects") {
    return `Upgrade to PRO to unlock subprojects and advanced project management.`;
  }
  if (reason === "more_projects") {
    return `Upgrade to PRO to create up to 5 projects, or ENTERPRISE for unlimited projects.`;
  }
  if (reason === "recurring_tasks") {
    return `Upgrade to PRO to unlock recurring tasks and automate your workflow.`;
  }
  return `Upgrade your plan to unlock this feature.`;
}

/**
 * Get correct subscription limits for a plan
 * Converts -1 (unlimited) to 999999 for display purposes
 */
export function getCorrectLimitsForPlan(plan: string): {
  projectLimit: number;
  taskLimit: number;
} {
  const planKey = plan as keyof typeof PROJECT_LIMITS;
  const projectLimitValue = PROJECT_LIMITS[planKey];
  const taskLimitValue = TASK_LIMITS[planKey];

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
 * Get mind map limits for a subscription plan
 */
export function getMindMapLimit(plan: SubscriptionPlan) {
  return MIND_MAP_LIMITS[plan];
}

/**
 * Check if user can create a mind map
 * @param plan - User's subscription plan
 * @param currentMindMapCount - Current number of mind maps user has
 * @returns Object with allowed boolean and message
 */
export function canCreateMindMap(
  plan: SubscriptionPlan,
  currentMindMapCount: number
): { allowed: boolean; message?: string } {
  const limits = getMindMapLimit(plan);

  // Check if plan supports mind maps at all
  if (limits.maxMindMaps === 0) {
    return {
      allowed: false,
      message: "Mind mapping is not available on your current plan. Upgrade to PRO to create mind maps.",
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
      message: `You have reached your mind map limit (${limits.maxMindMaps}) on the ${plan} plan. Upgrade to ENTERPRISE for unlimited mind maps.`,
    };
  }

  return { allowed: true };
}

/**
 * Check if a mind map can have a certain number of nodes
 * @param plan - User's subscription plan
 * @param nodeCount - Number of nodes in the mind map
 * @returns Object with allowed boolean and message
 */
export function canCreateMindMapWithNodes(
  plan: SubscriptionPlan,
  nodeCount: number
): { allowed: boolean; message?: string } {
  const limits = getMindMapLimit(plan);

  // Check if plan supports mind maps at all
  if (limits.maxMindMaps === 0) {
    return {
      allowed: false,
      message: "Mind mapping is not available on your current plan. Upgrade to PRO to create mind maps.",
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
      message: `Your mind map exceeds the node limit (${limits.maxNodesPerMindMap}) for the ${plan} plan. Upgrade to ENTERPRISE for unlimited nodes per mind map.`,
    };
  }

  return { allowed: true };
}
