import type { z } from "zod";
import { anthropicJson, anthropicStream } from "./anthropic";
import { openRouterJson, openRouterStream } from "./openrouter";
import type { JsonRequest, StreamRequest } from "./types";

export { AiError, type ChatMessage } from "./types";

// Anthropic when its key is set, otherwise OpenRouter; with neither the app runs its demo mode.
export const aiProvider: "anthropic" | "openrouter" | null = process.env.ANTHROPIC_API_KEY
  ? "anthropic"
  : process.env.OPENROUTER_API_KEY
    ? "openrouter"
    : null;

/** A reply that matches `schema`. Throws AiError. */
export function generateJson<S extends z.ZodType>(schema: S, req: JsonRequest): Promise<z.infer<S>> {
  return aiProvider === "anthropic" ? anthropicJson(schema, req) : openRouterJson(schema, req);
}

/** The reply as text deltas. Throws AiError. */
export function streamText(req: StreamRequest, signal: AbortSignal): AsyncGenerator<string> {
  return aiProvider === "anthropic" ? anthropicStream(req, signal) : openRouterStream(req, signal);
}
