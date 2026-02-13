import * as fs from "fs";
import * as path from "path";
import { TaskQuadrantClient } from "../../core/api-client";
import { createLogger } from "../../core/logger";

const log = createLogger("mark.file-handler");

/**
 * Download an artifact from TaskQuadrant and save it to the working directory.
 * Returns the local file path where the artifact was saved.
 */
export async function downloadArtifact(
  taskId: string,
  artifactId: string,
  workDir: string,
  api: TaskQuadrantClient
): Promise<{ success: boolean; filePath?: string; fileName?: string; error?: string }> {
  try {
    // Fetch artifact with content via the bot API
    const response = await api.getArtifact(taskId, artifactId);

    if (!response.success || !response.data) {
      return { success: false, error: response.error?.message || "Failed to fetch artifact" };
    }

    const artifact = response.data;

    // Decode base64 content and write to file
    const buffer = Buffer.from(artifact.content, "base64");
    const localPath = path.join(workDir, artifact.fileName);

    // Ensure working directory exists
    if (!fs.existsSync(workDir)) {
      fs.mkdirSync(workDir, { recursive: true });
    }

    fs.writeFileSync(localPath, buffer);

    log.info("Artifact downloaded", {
      taskId,
      artifactId,
      fileName: artifact.fileName,
      sizeBytes: buffer.length,
      localPath,
    });

    return { success: true, filePath: localPath, fileName: artifact.fileName };
  } catch (err) {
    const message = (err as Error).message || "Unknown error";
    log.error("Failed to download artifact", { taskId, artifactId, error: message });
    return { success: false, error: message };
  }
}

/**
 * Upload a local file to TaskQuadrant as a task artifact.
 */
export async function uploadArtifact(
  taskId: string,
  filePath: string,
  fileName: string,
  mimeType: string,
  api: TaskQuadrantClient
): Promise<{ success: boolean; artifactId?: string; error?: string }> {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: `File not found: ${filePath}` };
    }

    const buffer = fs.readFileSync(filePath);
    const base64Content = buffer.toString("base64");

    // Check size limit (1MB base64)
    if (base64Content.length > 1_000_000) {
      return { success: false, error: `File too large. Base64 size: ${base64Content.length} bytes (max 1MB)` };
    }

    const response = await api.uploadArtifact(taskId, fileName, mimeType, base64Content);

    if (!response.success || !response.data) {
      return { success: false, error: response.error?.message || "Failed to upload artifact" };
    }

    log.info("Artifact uploaded", {
      taskId,
      fileName,
      sizeBytes: buffer.length,
      artifactId: response.data.id,
    });

    return { success: true, artifactId: response.data.id };
  } catch (err) {
    const message = (err as Error).message || "Unknown error";
    log.error("Failed to upload artifact", { taskId, filePath, error: message });
    return { success: false, error: message };
  }
}
