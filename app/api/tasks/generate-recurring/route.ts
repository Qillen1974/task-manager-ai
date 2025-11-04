import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/apiResponse";
import { generateRecurringTaskInstances, generateInstanceForTask, countPendingGenerations } from "@/lib/recurringTaskGenerator";
import { verifyAuth } from "@/lib/middleware";

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
