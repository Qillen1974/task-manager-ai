import { PROJECT_LIMITS, TASK_LIMITS } from './projectLimits';

/**
 * Validate if a user can downgrade to a specific plan
 * @param newPlan - The plan to downgrade to
 * @param currentProjectCount - Number of projects user currently has
 * @param currentTaskCount - Number of tasks user currently has
 * @returns Object with allowed boolean and message
 */
export function validateDowngrade(
  newPlan: 'FREE' | 'PRO' | 'ENTERPRISE',
  currentProjectCount: number,
  currentTaskCount: number
): { allowed: boolean; message?: string; excessProjects?: number; excessTasks?: number } {
  const newPlanLimits = PROJECT_LIMITS[newPlan];
  const newTaskLimits = TASK_LIMITS[newPlan];

  // Calculate excess items
  const maxProjects = newPlanLimits.maxProjects === -1 ? Infinity : newPlanLimits.maxProjects;
  const maxTasks = newTaskLimits.maxTasks === -1 ? Infinity : newTaskLimits.maxTasks;

  const excessProjects = Math.max(0, currentProjectCount - maxProjects);
  const excessTasks = Math.max(0, currentTaskCount - maxTasks);

  if (excessProjects > 0 || excessTasks > 0) {
    let message = `Cannot downgrade to ${newPlan} plan. `;
    if (excessProjects > 0) {
      message += `You have ${currentProjectCount} projects but ${newPlan} allows ${maxProjects}. `;
    }
    if (excessTasks > 0) {
      message += `You have ${currentTaskCount} tasks but ${newPlan} allows ${maxTasks}. `;
    }
    message += 'Please delete or archive items to meet the plan limits before downgrading.';

    return {
      allowed: false,
      message,
      excessProjects,
      excessTasks,
    };
  }

  return { allowed: true };
}

/**
 * Get what would happen if user cancels subscription
 * @param currentProjectCount - Number of root projects user currently has
 * @param currentTaskCount - Number of tasks user currently has
 * @returns Object with summary of what will be affected
 */
export function getCancellationSummary(
  currentProjectCount: number,
  currentTaskCount: number
) {
  const freePlanLimits = PROJECT_LIMITS.FREE;
  const freeTaskLimits = TASK_LIMITS.FREE;

  const maxProjects = freePlanLimits.maxProjects;
  const maxTasks = freeTaskLimits.maxTasks;

  const excessProjects = Math.max(0, currentProjectCount - maxProjects);
  const excessTasks = Math.max(0, currentTaskCount - maxTasks);

  return {
    excessProjects,
    excessTasks,
    hasExcess: excessProjects > 0 || excessTasks > 0,
    message: excessProjects > 0 || excessTasks > 0
      ? `You will have ${excessProjects} excess projects and ${excessTasks} excess tasks that will become read-only for 30 days.`
      : 'You can cancel your subscription without any impact to your data.',
    readOnlyDays: 30,
  };
}
