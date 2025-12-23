import { NextRequest } from "next/server";
import { success, error, handleApiError } from "@/lib/apiResponse";
import { cleanupCompletedTasks, previewCleanupForUser } from "@/lib/completedTaskCleanup";
import { verifyAuth } from "@/lib/middleware";

/**
 * POST /api/tasks/cleanup-completed
 *
 * Triggers cleanup of completed tasks based on user retention settings
 *
 * Query parameters:
 * - action: "cleanup-all" | "preview" (default: "cleanup-all")
 *
 * Authentication: Required
 * - "cleanup-all": Requires admin privileges or cron secret
 * - "preview": Any authenticated user (shows their own preview)
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    // Check for cron secret (for scheduled jobs)
    const cronSecret = request.headers.get("x-cron-secret");
    const isCronJob = cronSecret === process.env.CRON_SECRET;

    // If not a cron job, require authentication
    if (!isCronJob) {
      const auth = await verifyAuth(request);
      if (!auth.authenticated) {
        return auth.error;
      }
    }

    const url = new URL(request.url);
    const action = url.searchParams.get("action") || "cleanup-all";

    // Handle preview for current user
    if (action === "preview") {
      const auth = await verifyAuth(request);
      if (!auth.authenticated || !auth.userId) {
        return error("Authentication required for preview", 401);
      }

      const preview = await previewCleanupForUser(auth.userId);
      return success({
        action: "preview",
        ...preview,
        message: `${preview.tasksToDelete} completed task${preview.tasksToDelete !== 1 ? "s" : ""} would be deleted (older than ${preview.retentionDays} days)`,
      });
    }

    // Handle cleanup-all (requires admin or cron)
    if (action === "cleanup-all") {
      // For non-cron requests, verify admin status
      if (!isCronJob) {
        const auth = await verifyAuth(request);
        if (!auth.authenticated) {
          return auth.error;
        }

        // Check if user is admin
        const isAdmin = auth.isAdmin === true;
        if (!isAdmin) {
          return error("Admin privileges required for system-wide cleanup", 403);
        }
      }

      const result = await cleanupCompletedTasks();

      return success({
        action: "cleanup-all",
        ...result,
      });
    }

    return error(`Unknown action: ${action}`, 400);
  });
}

/**
 * GET /api/tasks/cleanup-completed
 *
 * Get cleanup preview for the authenticated user
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated || !auth.userId) {
      return auth.error;
    }

    const preview = await previewCleanupForUser(auth.userId);

    return success({
      ...preview,
      message: `${preview.tasksToDelete} completed task${preview.tasksToDelete !== 1 ? "s" : ""} eligible for cleanup (older than ${preview.retentionDays} days)`,
    });
  });
}
