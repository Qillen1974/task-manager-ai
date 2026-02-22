import { execFile } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const GIT_TIMEOUT_MS = 60_000;

export interface GitRepoContext {
  repoDir: string;
  branch: string;
  repoUrl: string;
  taskId: string;
  botName: string;
}

function runGit(
  args: string[],
  cwd: string,
  env?: Record<string, string>
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      args,
      {
        cwd,
        timeout: GIT_TIMEOUT_MS,
        maxBuffer: 1024 * 1024,
        env: { ...process.env, ...env },
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              `git ${args[0]} failed: ${error.message}\nstderr: ${stderr}`
            )
          );
        } else {
          resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
        }
      }
    );
  });
}

function buildAuthUrl(repoSlug: string, token: string): string {
  return `https://x-access-token:${token}@github.com/${repoSlug}.git`;
}

export async function setupRepo(
  repoSlug: string,
  githubToken: string,
  taskId: string,
  botName: string
): Promise<GitRepoContext> {
  const repoDir = path.join(os.tmpdir(), `${botName}-repo-${taskId}`);
  const branch = `feat/task-${taskId}`;
  const authUrl = buildAuthUrl(repoSlug, githubToken);

  if (fs.existsSync(repoDir)) {
    // Reuse existing clone — fetch and checkout
    await runGit(["fetch", "origin"], repoDir);
    try {
      await runGit(["checkout", branch], repoDir);
    } catch {
      // Branch doesn't exist locally yet — create from origin/main
      await runGit(["checkout", "-b", branch, "origin/main"], repoDir);
    }
  } else {
    // Fresh clone
    await runGit(["clone", authUrl, repoDir], os.tmpdir());
    await runGit(["checkout", "-b", branch], repoDir);
  }

  // Configure author for this repo
  await runGit(
    ["config", "user.name", `${botName}-bot`],
    repoDir
  );
  await runGit(
    ["config", "user.email", `${botName}@taskquadrant.io`],
    repoDir
  );

  return { repoDir, branch, repoUrl: authUrl, taskId, botName };
}

export function writeFileToRepo(
  context: GitRepoContext,
  relativePath: string,
  content: string
): string {
  // Validate no path traversal
  const normalized = path.normalize(relativePath);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    throw new Error(
      `Invalid file path: "${relativePath}". Must be relative and within the repo.`
    );
  }

  const fullPath = path.join(context.repoDir, normalized);

  // Ensure parent directory exists
  const dir = path.dirname(fullPath);
  fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(fullPath, content, "utf-8");
  return `File written: ${normalized}`;
}

export async function commitAndPush(
  context: GitRepoContext,
  commitMessage: string
): Promise<string> {
  // Stage all changes
  await runGit(["add", "-A"], context.repoDir);

  // Check if there's anything to commit
  const { stdout: status } = await runGit(
    ["status", "--porcelain"],
    context.repoDir
  );
  if (!status.trim()) {
    throw new Error("Nothing to commit — no changes detected.");
  }

  // Commit
  await runGit(["commit", "-m", commitMessage], context.repoDir);

  // Push (no force)
  await runGit(
    ["push", "-u", "origin", context.branch],
    context.repoDir
  );

  return `Committed and pushed to branch "${context.branch}".\nCommit message: ${commitMessage}`;
}

export async function getRepoStatus(
  context: GitRepoContext
): Promise<string> {
  const { stdout: status } = await runGit(["status"], context.repoDir);
  const { stdout: branch } = await runGit(
    ["branch", "--show-current"],
    context.repoDir
  );
  return `Branch: ${branch.trim()}\n\n${status}`;
}

export function cleanupRepo(context: GitRepoContext): void {
  if (fs.existsSync(context.repoDir)) {
    fs.rmSync(context.repoDir, { recursive: true, force: true });
  }
}
