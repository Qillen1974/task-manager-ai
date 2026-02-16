import { loadConfig } from "./config";
import { createLogger } from "../core/logger";
import { TaskQuadrantClient } from "../core/api-client";
import { KimiClient } from "../core/llm/kimi";
import { processTask } from "./brain";
import { reviewTask } from "./review";

// ── Load config (exits if missing required vars) ──
const config = loadConfig();
const log = createLogger("mark.main");

// ── State ──
const inProgress = new Set<string>();
const inReview = new Set<string>();
let shuttingDown = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let reviewTimer: ReturnType<typeof setInterval> | null = null;

// ── Initialize clients ──
const api = new TaskQuadrantClient(config.TQ_BASE_URL, config.TQ_API_KEY);
const llm = new KimiClient(config.KIMI_API_KEY);

// ── Poll loop ──

async function pollOnce(): Promise<void> {
  if (shuttingDown) return;

  try {
    const response = await api.listTasks({
      assignedToBot: true,
      completed: false,
    });

    if (!response.success || !response.data) {
      log.error("Failed to fetch tasks", { error: response.error });
      return;
    }

    const tasks = response.data.tasks;
    let newTaskCount = 0;

    for (const task of tasks) {
      // Skip if already being processed by this daemon instance
      if (inProgress.has(task.id)) continue;

      // Skip if already started (progress > 0 means we or another instance already picked it up)
      if (task.progress > 0) continue;

      newTaskCount++;
      inProgress.add(task.id);

      // Process asynchronously — don't block the poll loop
      processTask(task, api, llm, config, log)
        .catch((err) => {
          log.error("Unhandled error in task processing", {
            taskId: task.id,
            error: (err as Error).message,
          });
        })
        .finally(() => {
          inProgress.delete(task.id);
        });
    }

    if (newTaskCount > 0) {
      log.info("Picked up new tasks", { count: newTaskCount });
    }
  } catch (err) {
    log.error("Poll cycle error", { error: (err as Error).message });
  }
}

// ── Review poll loop (checks tasks John has completed) ──

async function reviewOnce(): Promise<void> {
  if (shuttingDown) return;

  try {
    // Fetch tasks in REVIEW status across Mark's projects
    const response = await api.listTasks({
      completed: false,
      status: "REVIEW",
    });

    if (!response.success || !response.data) {
      log.error("Failed to fetch review tasks", { error: response.error });
      return;
    }

    const tasks = response.data.tasks;
    let reviewCount = 0;

    for (const task of tasks) {
      // Only review tasks assigned to John (delegated tasks)
      if (task.assignedToBotId !== config.JOHN_BOT_ID) continue;

      // Skip if already being reviewed
      if (inReview.has(task.id)) continue;

      reviewCount++;
      inReview.add(task.id);

      reviewTask(task, api, llm, config, log)
        .catch((err) => {
          log.error("Unhandled error in task review", {
            taskId: task.id,
            error: (err as Error).message,
          });
        })
        .finally(() => {
          inReview.delete(task.id);
        });
    }

    if (reviewCount > 0) {
      log.info("Picked up tasks for review", { count: reviewCount });
    }
  } catch (err) {
    log.error("Review poll cycle error", { error: (err as Error).message });
  }
}

// ── Graceful shutdown ──

function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;

  log.info(`Received ${signal}. Shutting down gracefully...`);

  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (reviewTimer) {
    clearInterval(reviewTimer);
    reviewTimer = null;
  }

  if (inProgress.size === 0 && inReview.size === 0) {
    log.info("No tasks in progress. Exiting.");
    process.exit(0);
  }

  // Wait for in-progress tasks (with 5 min timeout — Mark tasks can be long)
  const forceExitTimeout = setTimeout(() => {
    log.warn("Shutdown timeout reached. Forcing exit.", { pendingTasks: inProgress.size });
    process.exit(1);
  }, 300_000);

  const checkInterval = setInterval(() => {
    if (inProgress.size === 0 && inReview.size === 0) {
      clearInterval(checkInterval);
      clearTimeout(forceExitTimeout);
      log.info("All tasks finished. Exiting.");
      process.exit(0);
    }
    log.info(`Waiting for ${inProgress.size} task(s) + ${inReview.size} review(s) to finish...`);
  }, 5000);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ── Startup ──

async function main(): Promise<void> {
  log.info("Mark daemon starting...", {
    baseUrl: config.TQ_BASE_URL,
    pollInterval: config.POLL_INTERVAL_MS,
    maxToolRounds: config.MAX_TOOL_ROUNDS,
    codeExecTimeout: config.CODE_EXEC_TIMEOUT_MS,
    maxOutputBytes: config.MAX_OUTPUT_BYTES,
  });

  // Verify API key
  const authResult = await api.verifyAuth();
  if (!authResult.success || !authResult.data) {
    log.error("Auth verification failed", { error: authResult.error });
    process.exit(1);
  }

  log.info(`Auth verified: Bot "${authResult.data.name}" (${authResult.data.id})`, {
    permissions: authResult.data.permissions,
    projects: authResult.data.projectIds,
  });

  // Start polling (tasks + reviews on same interval)
  pollTimer = setInterval(pollOnce, config.POLL_INTERVAL_MS);
  reviewTimer = setInterval(reviewOnce, config.POLL_INTERVAL_MS);

  // Also run immediately
  await pollOnce();
  await reviewOnce();

  log.info(`Mark daemon running. Polling every ${config.POLL_INTERVAL_MS / 1000}s (tasks + reviews). Press Ctrl+C to stop.`);
}

main().catch((err) => {
  log.error("Fatal startup error", { error: (err as Error).message });
  process.exit(1);
});
