import axios, { AxiosInstance } from "axios";
import { LLMClient, LLMMessage, LLMToolDefinition, LLMResponse, LLMToolCall } from "./types";
import { createLogger } from "../logger";

const log = createLogger("core.llm.minimax");

const MINIMAX_BASE_URL = "https://api.minimax.io/v1";
const MINIMAX_MODEL = "minimax-m2.1";

export class MiniMaxClient implements LLMClient {
  private http: AxiosInstance;

  constructor(apiKey: string) {
    const trimmedKey = apiKey.trim();
    log.debug("MiniMax client initialized", {
      keyLength: trimmedKey.length,
      keyPrefix: trimmedKey.slice(0, 8) + "...",
    });
    this.http = axios.create({
      baseURL: MINIMAX_BASE_URL,
      headers: {
        Authorization: `Bearer ${trimmedKey}`,
        "Content-Type": "application/json",
      },
      timeout: 120_000, // LLM calls can be slow
    });
  }

  async chat(messages: LLMMessage[], tools?: LLMToolDefinition[]): Promise<LLMResponse> {
    // Build request body in OpenAI-compatible format
    const requestBody: Record<string, unknown> = {
      model: MINIMAX_MODEL,
      messages: messages.map((msg) => this.formatMessage(msg)),
      max_tokens: 4096,
      temperature: 0.3,
    };

    if (tools && tools.length > 0) {
      requestBody.tools = tools;
    }

    log.debug("Sending chat request", {
      messageCount: messages.length,
      hasTools: !!tools?.length,
    });

    const response = await this.http.post("/chat/completions", requestBody);
    const data = response.data;

    if (!data.choices || data.choices.length === 0) {
      throw new Error("MiniMax returned no choices");
    }

    const choice = data.choices[0];
    return this.parseChoice(choice, data.usage);
  }

  private formatMessage(msg: LLMMessage): Record<string, unknown> {
    const formatted: Record<string, unknown> = {
      role: msg.role,
      content: msg.content,
    };

    // Include tool_call_id for tool responses
    if (msg.role === "tool" && msg.tool_call_id) {
      formatted.tool_call_id = msg.tool_call_id;
      if (msg.name) formatted.name = msg.name;
    }

    // Include tool_calls for assistant messages that made tool calls
    if (msg.role === "assistant" && msg.tool_calls && msg.tool_calls.length > 0) {
      formatted.tool_calls = msg.tool_calls.map((tc) => ({
        id: tc.id,
        type: "function",
        function: {
          name: tc.name,
          arguments: JSON.stringify(tc.input),
        },
      }));
      // When assistant has tool_calls, content may be empty
      if (!msg.content) formatted.content = "";
    }

    return formatted;
  }

  private parseChoice(
    choice: any,
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
  ): LLMResponse {
    const message = choice.message;
    let content: string | null = null;
    let thinking: string | null = null;
    const toolCalls: LLMToolCall[] = [];

    // MiniMax can return content as a string or as an array of blocks
    const rawContent = message.content;

    if (typeof rawContent === "string") {
      content = rawContent;
    } else if (Array.isArray(rawContent)) {
      // Parse content blocks
      const textParts: string[] = [];
      for (const block of rawContent) {
        if (block.type === "text" && block.text) {
          textParts.push(block.text);
        } else if (block.type === "thinking" && block.thinking) {
          thinking = (thinking || "") + block.thinking;
        } else if (block.type === "tool_use") {
          toolCalls.push({
            id: block.id || `tool_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            name: block.name,
            input: block.input || {},
          });
        }
      }
      if (textParts.length > 0) {
        content = textParts.join("\n");
      }
    }

    // Also check the standard OpenAI tool_calls field
    if (message.tool_calls && Array.isArray(message.tool_calls)) {
      for (const tc of message.tool_calls) {
        // Don't duplicate if already found in content blocks
        if (toolCalls.some((existing) => existing.id === tc.id)) continue;

        let input: Record<string, unknown> = {};
        try {
          input = typeof tc.function.arguments === "string"
            ? JSON.parse(tc.function.arguments)
            : tc.function.arguments || {};
        } catch {
          log.warn("Failed to parse tool call arguments", { raw: tc.function.arguments });
        }

        toolCalls.push({
          id: tc.id || `tool_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: tc.function.name,
          input,
        });
      }
    }

    const finishReason = choice.finish_reason || (toolCalls.length > 0 ? "tool_calls" : "stop");

    log.debug("Parsed LLM response", {
      hasContent: !!content,
      hasThinking: !!thinking,
      toolCallCount: toolCalls.length,
      finishReason,
    });

    return {
      content,
      thinking,
      toolCalls,
      finishReason,
      usage: {
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
      },
    };
  }
}
