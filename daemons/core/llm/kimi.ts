import { LLMClient, LLMMessage, LLMToolDefinition, LLMResponse } from "./types";

/**
 * Kimi 2.5 (Moonshot AI) client — placeholder for Mark's daemon.
 * Will be implemented when we build Mark's brain.
 */
export class KimiClient implements LLMClient {
  constructor(_apiKey: string) {}

  async chat(_messages: LLMMessage[], _tools?: LLMToolDefinition[]): Promise<LLMResponse> {
    throw new Error("KimiClient is not implemented yet — this is for the Mark daemon (next session).");
  }
}
