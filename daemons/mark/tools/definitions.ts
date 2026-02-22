import { LLMToolDefinition } from "../../core/llm/types";

export const TOOL_DEFINITIONS: LLMToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "execute_code",
      description:
        "Execute code with full system access. Supports Node.js (ES2020+) and Python 3. " +
        "Code runs in a persistent per-task working directory with a 5-minute timeout. " +
        "You CAN install packages (pip install, npm install), read/write files in the working directory, " +
        "and use any standard or third-party library. " +
        "stdout and stderr are captured and returned. Output is capped at 500KB per stream.",
      parameters: {
        type: "object",
        properties: {
          language: {
            type: "string",
            enum: ["nodejs", "python"],
            description: "The programming language to execute the code in.",
          },
          code: {
            type: "string",
            description:
              "The complete code to execute. You can use any installed packages. " +
              "For Node.js, use console.log() for output. For Python, use print() for output. " +
              "Install packages with subprocess if needed (e.g., subprocess.run(['pip', 'install', 'openpyxl'])).",
          },
        },
        required: ["language", "code"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "download_artifact",
      description:
        "Download a file attachment from the current task. " +
        "The file will be saved to the per-task working directory and you can then process it with execute_code. " +
        "Use this when the task has attached files (e.g., Excel, CSV, PDF) that need processing.",
      parameters: {
        type: "object",
        properties: {
          artifactId: {
            type: "string",
            description: "The ID of the artifact to download (from the task's artifact list).",
          },
        },
        required: ["artifactId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "upload_artifact",
      description:
        "Upload a result file from the working directory back to the task as an attachment. " +
        "The user will be able to download this file from the TaskQuadrant web UI. " +
        "Use this after processing data to return result files (e.g., processed Excel, generated PDF, CSV output).",
      parameters: {
        type: "object",
        properties: {
          filePath: {
            type: "string",
            description: "Path to the file in the working directory to upload (relative or absolute).",
          },
          fileName: {
            type: "string",
            description: "The display name for the uploaded file (e.g., 'processed-data.xlsx').",
          },
          mimeType: {
            type: "string",
            description:
              "The MIME type of the file. Common types: " +
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (xlsx), " +
              "text/csv (csv), application/pdf (pdf), text/plain (txt), application/json (json), " +
              "image/png (png), image/jpeg (jpeg).",
          },
        },
        required: ["filePath", "fileName", "mimeType"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "git_push_code",
      description:
        "Interact with a GitHub repository to push code. Use this when a task asks you to write code for a project repo. " +
        "Workflow: call with action 'setup_repo' first, then 'write_file' for each file, then 'commit_and_push' to push.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["setup_repo", "write_file", "commit_and_push", "status"],
            description:
              "The git action to perform. " +
              "setup_repo: clone repo and create a feature branch (call first). " +
              "write_file: write a file to the repo (requires file_path, file_content). " +
              "commit_and_push: stage all changes, commit, and push (requires commit_message). " +
              "status: show current repo status.",
          },
          file_path: {
            type: "string",
            description:
              "Relative file path within the repo (e.g., 'src/utils/scoring.ts'). Required for write_file action.",
          },
          file_content: {
            type: "string",
            description: "The full content to write to the file. Required for write_file action.",
          },
          commit_message: {
            type: "string",
            description:
              "The commit message (e.g., 'feat: add hand scoring utility'). Required for commit_and_push action.",
          },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the web for current information. Use this for recent events, product releases, " +
        "documentation, pricing, or any topic where training data may be outdated.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query",
          },
          num_results: {
            type: "number",
            description: "Number of results to return (1-10, default 5)",
          },
        },
        required: ["query"],
      },
    },
  },
];
