import { TaskQuadrantClient, TaskQuadrantTask } from "../core/api-client";
import { LLMClient, LLMMessage } from "../core/llm/types";
import { Logger } from "../core/logger";
import { MarkConfig } from "./config";

const MAX_REWORKS = 2;

/**
 * Review a task that John has completed (status=REVIEW).
 * Evaluates quality via LLM and either approves or sends back for rework.
 */
export async function reviewTask(
  task: TaskQuadrantTask,
  api: TaskQuadrantClient,
  llm: LLMClient,
  config: MarkConfig,
  log: Logger
): Promise<void> {
  const taskId = task.id;
  log.info("Reviewing task", { taskId, title: task.title });

  try {
    // Fetch task details with comments
    const detailResponse = await api.getTask(taskId);
    if (!detailResponse.success || !detailResponse.data) {
      log.error("Failed to fetch task details for review", { taskId });
      return;
    }

    const detail = detailResponse.data;
    const comments = detail.comments;

    // Find John's result comment (the last "[John] Result:" comment)
    const johnResultComment = [...comments]
      .reverse()
      .find((c) => c.body.startsWith("[John] Result:"));

    if (!johnResultComment) {
      log.warn("No John result comment found, skipping review", { taskId });
      return;
    }

    // Count how many reworks have already happened
    const reworkCount = comments.filter(
      (c) => c.body.startsWith("[Mark] Sending back for rework:")
    ).length;

    // Build review prompt
    const reviewMessages: LLMMessage[] = [
      {
        role: "system",
        content: `You are Mark, reviewing work completed by John (an AI agent).
Your job is to evaluate whether the result is complete, accurate, and meets the task requirements.

${reworkCount >= MAX_REWORKS ? "NOTE: This task has already been sent back for rework " + reworkCount + " time(s). The maximum is " + MAX_REWORKS + ". If the quality is still not acceptable, you MUST approve it anyway and note the limitations — do not send it back again." : ""}

Respond with ONLY a JSON object, no other text:
{ "verdict": "approve" | "rework", "feedback": "brief explanation of your decision" }`,
      },
      {
        role: "user",
        content: `Original task: ${task.title}\n\nTask description:\n${task.description || "(no description)"}\n\nJohn's result:\n${johnResultComment.body}`,
      },
    ];

    const reviewResponse = await llm.chat(reviewMessages, []);
    const reviewText = reviewResponse.content?.trim() || "";
    log.debug("Review LLM response", { taskId, reviewText });

    // Parse JSON from response
    const jsonMatch = reviewText.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      log.warn("Could not parse review decision, defaulting to approve", { taskId, reviewText });
      await api.updateTask(taskId, { status: "DONE", completed: true, progress: 100 });
      await api.addComment(taskId, "[Mark] Reviewed and approved (could not parse review, defaulting to approve).");
      return;
    }

    const decision = JSON.parse(jsonMatch[0]) as { verdict: string; feedback: string };

    if (decision.verdict === "rework" && reworkCount < MAX_REWORKS) {
      // Send back for rework
      log.info("Sending task back to John for rework", { taskId, feedback: decision.feedback, reworkCount: reworkCount + 1 });

      await api.addComment(
        taskId,
        `[Mark] Sending back for rework: ${decision.feedback}`,
        { reworkCount: reworkCount + 1 }
      );
      await api.updateTask(taskId, {
        assignedToBotId: config.JOHN_BOT_ID,
        status: "TODO",
        progress: 0,
      });
    } else {
      // Approve (or forced approve after max reworks)
      const wasForced = decision.verdict === "rework" && reworkCount >= MAX_REWORKS;
      const approvalNote = wasForced
        ? `[Mark] Reviewed and approved (max rework limit reached). ${decision.feedback}`
        : `[Mark] Reviewed and approved. ${decision.feedback}`;

      log.info("Approving task", { taskId, forced: wasForced, feedback: decision.feedback });

      await api.updateTask(taskId, { status: "DONE", completed: true, progress: 100 });
      await api.addComment(taskId, approvalNote);
    }
  } catch (err) {
    log.error("Error reviewing task", { taskId, error: (err as Error).message });
    try {
      await api.addComment(
        taskId,
        `[Mark] Error during review: ${(err as Error).message}. Task left in REVIEW status for manual check.`
      );
    } catch {
      log.error("Failed to post review error comment", { taskId });
    }
  }
}
