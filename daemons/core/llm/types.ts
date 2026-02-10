/** Message roles for LLM conversation */
export type LLMRole = "system" | "user" | "assistant" | "tool";

/** A single message in the LLM conversation */
export interface LLMMessage {
  role: LLMRole;
  content: string;
  /** Required when role === 'tool' — references the tool call this is a response to */
  tool_call_id?: string;
  /** Tool name when role === 'tool' */
  name?: string;
  /** Tool calls made by the assistant (for conversation history) */
  tool_calls?: LLMToolCall[];
}

/** Tool definition in OpenAI function-calling format */
export interface LLMToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

/** A tool call requested by the LLM */
export interface LLMToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/** Parsed LLM response */
export interface LLMResponse {
  /** The final text content (may be null if only tool calls) */
  content: string | null;
  /** Thinking/reasoning content if the model provides it */
  thinking: string | null;
  /** Tool calls requested by the model */
  toolCalls: LLMToolCall[];
  /** Why the model stopped generating */
  finishReason: string;
  /** Token usage */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/** Common interface for all LLM clients */
export interface LLMClient {
  chat(messages: LLMMessage[], tools?: LLMToolDefinition[]): Promise<LLMResponse>;
}
