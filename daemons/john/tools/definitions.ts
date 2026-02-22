import { LLMToolDefinition } from "../../core/llm/types";

export const TOOL_DEFINITIONS: LLMToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "execute_code",
      description:
        "Execute code in a sandboxed environment. Supports Node.js (ES2020) and Python 3. " +
        "Code runs in an isolated temporary directory with a 30-second timeout. " +
        "stdout and stderr are captured and returned. " +
        "No network access, no file system access outside temp dir, no package installation. " +
        "Code must be self-contained with no external dependencies beyond the standard library.",
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
              "The complete code to execute. Must be self-contained — " +
              "use only standard library modules. For Node.js, use console.log() for output. " +
              "For Python, use print() for output.",
          },
        },
        required: ["language", "code"],
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
