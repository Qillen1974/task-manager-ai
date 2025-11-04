import { db } from "@/lib/db";
import { calculateNextOccurrenceDate, isRecurringTaskEnded } from "@/lib/utils";
import { Task } from "@prisma/client";

/**
 * Recurring Task Generation Service
 * Automatically generates new task instances from recurring task templates
 */

export interface GenerationResult {
  success: boolean;
  tasksGenerated: number;
  errors: Array<{ taskId: string; error: string }>;
  message: string;
}

/**
 * Generate new instances for all recurring tasks that are due
 * Should be called by a scheduled job (e.g., every hour or daily)
 */
export async function generateRecurringTaskInstances(): Promise<GenerationResult> {
  const errors: Array<{ taskId: string; error: string }> = [];
  let tasksGenerated = 0;

  try {
    // Find all recurring task templates that are due for generation
    const recurringTasks = await db.task.findMany({
      where: {
        isRecurring: true,
        parentTaskId: null, // Only parent tasks, not instances
      },
      include: {
        user: true,
      },
    });

    console.log(`[Recurring Tasks] Found ${recurringTasks.length} recurring task templates`);

    for (const task of recurringTasks) {
      try {
        const generated = await generateInstanceIfDue(task);
        if (generated) {
          tasksGenerated++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`[Recurring Tasks] Error generating instance for task ${task.id}:`, errorMessage);
        errors.push({
          taskId: task.id,
          error: errorMessage,
        });
      }
    }

    const message = `Generated ${tasksGenerated} task instance${tasksGenerated !== 1 ? "s" : ""}.${
      errors.length > 0 ? ` ${errors.length} error${errors.length !== 1 ? "s" : ""} occurred.` : ""
    }`;

    return {
      success: errors.length === 0,
      tasksGenerated,
      errors,
      message,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Recurring Tasks] Generation service error:", errorMessage);

    return {
      success: false,
      tasksGenerated: 0,
      errors: [{ taskId: "system", error: errorMessage }],
      message: `Generation service failed: ${errorMessage}`,
    };
  }
}

/**
 * Generate a new instance of a recurring task if it's due
 * Returns true if an instance was generated, false otherwise
 */
export async function generateInstanceIfDue(parentTask: Task): Promise<boolean> {
  // Check if task has ended
  const hasEnded = isRecurringTaskEnded(
    parentTask.lastGeneratedDate,
    parentTask.recurringConfig,
    parentTask.recurringEndDate
  );

  if (hasEnded) {
    console.log(`[Recurring Tasks] Task ${parentTask.id} has ended, skipping generation`);
    return false;
  }

  // Check if it's time to generate
  const now = new Date();
  const nextGenDate = parentTask.nextGenerationDate;

  if (!nextGenDate || now < nextGenDate) {
    return false; // Not due yet
  }

  // Generate the new instance
  const newInstance = await generateTaskInstance(parentTask);

  // Calculate next generation date
  const nextDate = calculateNextOccurrenceDate(parentTask.recurringStartDate || new Date(), parentTask.recurringConfig);

  // Update parent task with new generation info
  await db.task.update({
    where: { id: parentTask.id },
    data: {
      lastGeneratedDate: now,
      nextGenerationDate: nextDate,
    },
  });

  console.log(`[Recurring Tasks] Generated instance for task ${parentTask.id}, next generation: ${nextDate}`);

  return true;
}

/**
 * Create a new task instance from a recurring task template
 */
async function generateTaskInstance(parentTask: Task): Promise<Task> {
  // Calculate due date offset
  const now = new Date();
  const daysSinceStart = Math.floor((now.getTime() - (parentTask.recurringStartDate?.getTime() || 0)) / (1000 * 60 * 60 * 24));

  // Create new instance with adjusted dates
  let newDueDate = null;
  let newStartDate = null;

  if (parentTask.dueDate) {
    newDueDate = new Date(parentTask.dueDate.getTime() + daysSinceStart * 24 * 60 * 60 * 1000);
  }

  if (parentTask.startDate) {
    newStartDate = new Date(parentTask.startDate.getTime() + daysSinceStart * 24 * 60 * 60 * 1000);
  }

  const instance = await db.task.create({
    data: {
      userId: parentTask.userId,
      projectId: parentTask.projectId,
      title: `${parentTask.title} (${now.toLocaleDateString()})`,
      description: parentTask.description,
      priority: parentTask.priority,
      startDate: newStartDate,
      startTime: parentTask.startTime,
      dueDate: newDueDate,
      dueTime: parentTask.dueTime,
      resourceCount: parentTask.resourceCount,
      manhours: parentTask.manhours,
      dependsOnTaskId: parentTask.dependsOnTaskId,
      // Link to parent recurring task
      parentTaskId: parentTask.id,
      // Mark as non-recurring instance
      isRecurring: false,
    },
  });

  return instance;
}

/**
 * Generate instances for a specific recurring task
 * Useful for manual triggering if a generation was missed
 */
export async function generateInstanceForTask(taskId: string): Promise<boolean> {
  const task = await db.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }

  if (!task.isRecurring) {
    throw new Error(`Task ${taskId} is not a recurring task`);
  }

  if (task.parentTaskId) {
    throw new Error(`Task ${taskId} is an instance, not a template`);
  }

  return generateInstanceIfDue(task);
}

/**
 * Get generation status for a recurring task
 * Shows when the next instance will be generated
 */
export async function getGenerationStatus(taskId: string): Promise<{
  isRecurring: boolean;
  nextGenerationDate: Date | null;
  lastGeneratedDate: Date | null;
  hasEnded: boolean;
  generationDueNow: boolean;
} | null> {
  const task = await db.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    return null;
  }

  const hasEnded = isRecurringTaskEnded(task.lastGeneratedDate, task.recurringConfig, task.recurringEndDate);
  const generationDueNow = task.nextGenerationDate ? new Date() >= task.nextGenerationDate : false;

  return {
    isRecurring: task.isRecurring,
    nextGenerationDate: task.nextGenerationDate,
    lastGeneratedDate: task.lastGeneratedDate,
    hasEnded,
    generationDueNow,
  };
}

/**
 * Get all generated instances for a recurring task
 */
export async function getGeneratedInstances(parentTaskId: string): Promise<Task[]> {
  const instances = await db.task.findMany({
    where: {
      parentTaskId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return instances;
}

/**
 * Count pending generations (tasks due now)
 */
export async function countPendingGenerations(): Promise<number> {
  const now = new Date();

  const pendingCount = await db.task.count({
    where: {
      isRecurring: true,
      parentTaskId: null,
      nextGenerationDate: {
        lte: now,
      },
      recurringEndDate: {
        or: [
          { gt: now }, // End date in future
          { equals: null }, // No end date
        ],
      },
    },
  });

  return pendingCount;
}
