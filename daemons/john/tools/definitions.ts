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
