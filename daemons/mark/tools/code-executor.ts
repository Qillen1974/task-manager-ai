import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { createLogger } from "../../core/logger";

const log = createLogger("mark.code-executor");

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  timedOut: boolean;
}

/**
 * Mark's UNSANDBOXED code executor.
 * Unlike John's executor, Mark has:
 * - Full environment access (PATH, HOME, etc.)
 * - Persistent per-task working directory (NOT cleaned up between calls)
 * - Package installation support (pip, npm)
 * - 5-minute timeout (vs John's 30s)
 * - 500KB output cap (vs John's 50KB)
 */
export async function executeCode(
  language: "nodejs" | "python",
  code: string,
  timeoutMs: number,
  workDir: string,
  maxOutputBytes: number
): Promise<ExecutionResult> {
  const startTime = Date.now();

  // Ensure working directory exists
  if (!fs.existsSync(workDir)) {
    fs.mkdirSync(workDir, { recursive: true });
  }

  let fileName: string;
  let command: string;
  let args: string[];

  if (language === "nodejs") {
    fileName = "script.js";
    command = "node";
    args = [fileName];
  } else {
    fileName = "script.py";
    command = process.platform === "win32" ? "python" : "python3";
    args = [fileName];
  }

  const filePath = path.join(workDir, fileName);

  // Write code to file
  fs.writeFileSync(filePath, code, "utf-8");

  log.debug("Executing code (unsandboxed)", { language, workDir, timeoutMs });

  return new Promise<ExecutionResult>((resolve) => {
    const child = spawn(command, args, {
      cwd: workDir,
      timeout: timeoutMs,
      stdio: ["ignore", "pipe", "pipe"],
      // Full environment access — Mark is unrestricted
      env: {
        ...process.env,
        HOME: process.env.HOME || process.env.USERPROFILE,
      },
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    child.stdout.on("data", (chunk: Buffer) => {
      if (stdout.length < maxOutputBytes) {
        stdout += chunk.toString("utf-8");
        if (stdout.length > maxOutputBytes) {
          stdout = stdout.substring(0, maxOutputBytes) + "\n[OUTPUT TRUNCATED]";
        }
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < maxOutputBytes) {
        stderr += chunk.toString("utf-8");
        if (stderr.length > maxOutputBytes) {
          stderr = stderr.substring(0, maxOutputBytes) + "\n[OUTPUT TRUNCATED]";
        }
      }
    });

    child.on("error", (err) => {
      const durationMs = Date.now() - startTime;
      log.error("Process spawn error", { error: err.message, language });
      resolve({
        success: false,
        stdout,
        stderr: stderr || err.message,
        exitCode: -1,
        durationMs,
        timedOut: false,
      });
    });

    child.on("close", (exitCode, signal) => {
      const durationMs = Date.now() - startTime;

      if (signal === "SIGTERM" || signal === "SIGKILL") {
        timedOut = true;
        stderr += `\n[Process killed by ${signal} — likely exceeded ${timeoutMs}ms timeout]`;
      }

      log.debug("Code execution completed", {
        exitCode,
        signal,
        durationMs,
        timedOut,
        stdoutLen: stdout.length,
        stderrLen: stderr.length,
      });

      resolve({
        success: exitCode === 0 && !timedOut,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: exitCode ?? -1,
        durationMs,
        timedOut,
      });
    });
  });
}
