import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { createLogger } from "../../core/logger";

const log = createLogger("john.code-executor");

const MAX_OUTPUT_BYTES = 50 * 1024; // 50KB per stream

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  timedOut: boolean;
}

export async function executeCode(
  language: "nodejs" | "python",
  code: string,
  timeoutMs: number
): Promise<ExecutionResult> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "john-exec-"));
  const startTime = Date.now();

  // Determine file name and command
  let fileName: string;
  let command: string;
  let args: string[];

  if (language === "nodejs") {
    fileName = "script.js";
    command = "node";
    args = [fileName];
  } else {
    fileName = "script.py";
    // Try python3 first, fall back to python on Windows
    command = process.platform === "win32" ? "python" : "python3";
    args = [fileName];
  }

  const filePath = path.join(tmpDir, fileName);

  try {
    // Write code to file
    fs.writeFileSync(filePath, code, "utf-8");

    log.debug("Executing code", { language, tmpDir, timeoutMs });

    return await new Promise<ExecutionResult>((resolve) => {
      const child = spawn(command, args, {
        cwd: tmpDir,
        timeout: timeoutMs,
        stdio: ["ignore", "pipe", "pipe"],
        // Don't inherit environment to reduce attack surface
        env: {
          PATH: process.env.PATH,
          HOME: tmpDir,
          TMPDIR: tmpDir,
          TEMP: tmpDir,
          TMP: tmpDir,
          // Node.js needs this
          NODE_PATH: process.env.NODE_PATH,
        },
      });

      let stdout = "";
      let stderr = "";
      let timedOut = false;

      child.stdout.on("data", (chunk: Buffer) => {
        if (stdout.length < MAX_OUTPUT_BYTES) {
          stdout += chunk.toString("utf-8");
          if (stdout.length > MAX_OUTPUT_BYTES) {
            stdout = stdout.substring(0, MAX_OUTPUT_BYTES) + "\n[OUTPUT TRUNCATED]";
          }
        }
      });

      child.stderr.on("data", (chunk: Buffer) => {
        if (stderr.length < MAX_OUTPUT_BYTES) {
          stderr += chunk.toString("utf-8");
          if (stderr.length > MAX_OUTPUT_BYTES) {
            stderr = stderr.substring(0, MAX_OUTPUT_BYTES) + "\n[OUTPUT TRUNCATED]";
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
  } finally {
    // Clean up temp directory
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (cleanupErr) {
      log.warn("Failed to clean up temp dir", { tmpDir, error: (cleanupErr as Error).message });
    }
  }
}
