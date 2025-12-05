import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/apiResponse";
import { generateRecurringTaskInstances, generateInstanceForTask, countPendingGenerations, getGenerationStatus } from "@/lib/recurringTaskGenerator";
import { verifyAuth } from "@/lib/middleware";
import { db } from "@/lib/db";
import { calculateInitialNextGenerationDate } from "@/lib/utils";

/**
 * POST /api/tasks/generate-recurring
 *
 * Triggers the generation of new instances for recurring tasks
 *
 * Query parameters:
 * - action: "generate-all" | "generate-pending" | "count" (default: "generate-all")
 * - taskId: (optional) Generate for specific task
 *
 * Authentication: Required (admin or system)
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    // Get query parameters
    const url = new URL(request.url);
    const action = url.searchParams.get("action") || "generate-all";
    const taskId = url.searchParams.get("taskId");

    // Handle specific task generation
    if (action === "generate-for-task" && taskId) {
      try {
        const generated = await generateInstanceForTask(taskId);
        return success({
          message: generated
            ? `Generated new instance for task ${taskId}`
            : `Task ${taskId} is not due for generation yet`,
          generated,
          action: "generate-for-task",
          taskId,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        return error(errorMessage, 400, "GENERATION_ERROR");
      }
    }

    // Handle count pending
    if (action === "count") {
      const pendingCount = await countPendingGenerations();
      return success({
        action: "count",
        pendingGenerations: pendingCount,
        message: `${pendingCount} recurring task${pendingCount !== 1 ? "s" : ""} pending generation`,
      });
    }

    // Handle reset-next-dates - recalculate nextGenerationDate for all recurring tasks
    if (action === "reset-next-dates") {
      const recurringTasks = await db.task.findMany({
        where: {
          isRecurring: true,
          parentTaskId: null,
        },
      });

      const { calculateNextOccurrenceDate } = await import("@/lib/utils");
      let resetCount = 0;

      for (const task of recurringTasks) {
        try {
          // Recalculate next generation date with logic that handles missed occurrences
          const newNextDate = calculateInitialNextGenerationDate(task.recurringConfig);
          await db.task.update({
            where: { id: task.id },
            data: { nextGenerationDate: newNextDate },
          });
          resetCount++;
        } catch (err) {
          console.error(`Failed to reset nextGenerationDate for task ${task.id}:`, err);
        }
      }

      return success({
        action: "reset-next-dates",
        message: `Reset nextGenerationDate for ${resetCount} recurring tasks`,
        tasksReset: resetCount,
      });
    }

    // Handle status - get all recurring tasks with their status
    if (action === "list-status") {
      const recurringTasks = await db.task.findMany({
        where: {
          isRecurring: true,
          parentTaskId: null,
        },
        select: {
          id: true,
          title: true,
          isRecurring: true,
          recurringConfig: true,
          recurringStartDate: true,
          recurringEndDate: true,
          nextGenerationDate: true,
          lastGeneratedDate: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const now = new Date();
      const taskStatuses = recurringTasks.map((task) => ({
        id: task.id,
        title: task.title,
        recurringConfig: task.recurringConfig,
        nextGenerationDate: task.nextGenerationDate,
        lastGeneratedDate: task.lastGeneratedDate,
        isDueNow: task.nextGenerationDate ? now >= task.nextGenerationDate : false,
        daysUntilNext: task.nextGenerationDate
          ? Math.ceil((task.nextGenerationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null,
        recurringEndDate: task.recurringEndDate,
        hasEnded: task.recurringEndDate ? now > task.recurringEndDate : false,
      }));

      return success({
        action: "list-status",
        recurringTasks: taskStatuses,
        total: taskStatuses.length,
      });
    }

    // Handle cleanup-duplicates - remove duplicate recurring task instances
    if (action === "cleanup-duplicates") {
      const recurringTasks = await db.task.findMany({
        where: {
          isRecurring: true,
          parentTaskId: null,
        },
        select: { id: true, title: true },
      });

      let totalDuplicatesRemoved = 0;
      const cleanupDetails: Array<{ taskTitle: string; duplicatesRemoved: number }> = [];

      for (const recurringTask of recurringTasks) {
        // Find all instances of this recurring task
        const instances = await db.task.findMany({
          where: {
            parentTaskId: recurringTask.id,
            isRecurring: false,
          },
          orderBy: { createdAt: "asc" },
        });

        // Group instances by their title (which includes the date)
        const instancesByTitle = new Map<string, typeof instances>();
        for (const instance of instances) {
          if (!instancesByTitle.has(instance.title)) {
            instancesByTitle.set(instance.title, []);
          }
          instancesByTitle.get(instance.title)!.push(instance);
        }

        // For each group with duplicates, keep the oldest and delete the rest
        let duplicatesForThisTask = 0;
        for (const [title, duplicates] of instancesByTitle.entries()) {
          if (duplicates.length > 1) {
            // Keep the first (oldest) instance, delete the rest
            const toDelete = duplicates.slice(1);
            for (const duplicate of toDelete) {
              await db.task.delete({ where: { id: duplicate.id } });
              duplicatesForThisTask++;
              totalDuplicatesRemoved++;
            }
            console.log(`[Cleanup] Removed ${toDelete.length} duplicate(s) of "${title}"`);
          }
        }

        if (duplicatesForThisTask > 0) {
          cleanupDetails.push({
            taskTitle: recurringTask.title,
            duplicatesRemoved: duplicatesForThisTask,
          });
        }
      }

      return success({
        action: "cleanup-duplicates",
        message: `Removed ${totalDuplicatesRemoved} duplicate task instance${totalDuplicatesRemoved !== 1 ? "s" : ""}`,
        totalDuplicatesRemoved,
        cleanupDetails,
      });
    }

    // Default: Generate all due recurring tasks
    const result = await generateRecurringTaskInstances();

    return success({
      ...result,
      action: "generate-all",
    });
  });
}

/**
 * GET /api/tasks/generate-recurring
 *
 * Get status of pending recurring task generations
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const url = new URL(request.url);
    const action = url.searchParams.get("action") || "status";

    if (action === "status") {
      const pendingCount = await countPendingGenerations();
      return success({
        action: "status",
        pendingGenerations: pendingCount,
        ready: true,
      });
    }

    return error("Invalid action", 400, "INVALID_ACTION");
  });
}
