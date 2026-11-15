import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { AiError, type JsonRequest, type StreamRequest } from "./types";

const MODEL = "claude-opus-5-5";
const BETAS = ["server-side-fallback-2026-07-01"];

let client: Anthropic | null = null;
const anthropic = () => (client ??= new Anthropic());

function normalize(error: unknown): unknown {
  if (error instanceof Anthropic.RateLimitError) return new AiError("busy");
  if (error instanceof Anthropic.AuthenticationError) return new AiError("auth");
  if (error instanceof Anthropic.APIError) return new AiError("upstream", error.status);
  return error;
}

export async function anthropicJson<S extends z.ZodType>(schema: S, req: JsonRequest): Promise<z.infer<S>> {
  try {
    const response = await anthropic().beta.messages.parse({
      model: MODEL,
      max_tokens: 8000,
      betas: BETAS,
      fallbacks: "default",
      system: [{ type: "text", text: req.system, cache_control: { type: "ephemeral" } }],
      messages: req.messages,
      output_config: { effort: "low", format: betaZodOutputFormat(schema) },
    });
    if (response.stop_reason === "refusal") throw new AiError("refused");
    if (!response.parsed_output) throw new AiError("invalid");
    return response.parsed_output;
  } catch (error) {
    throw normalize(error);
  }
}

export async function* anthropicStream(req: StreamRequest, signal: AbortSignal): AsyncGenerator<string> {
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (req.question.jpegBase64) {
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: req.question.jpegBase64 } });
  }
  content.push({ type: "text", text: req.question.text });

  try {
    const stream = anthropic().beta.messages.stream(
      {
        model: MODEL,
        max_tokens: 4000,
        betas: BETAS,
        fallbacks: "default",
        system: [{ type: "text", text: req.system, cache_control: { type: "ephemeral" } }],
        output_config: { effort: "low" },
        messages: [...req.history, { role: "user", content }],
      },
      { signal },
    );
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield event.delta.text;
    }
    if ((await stream.finalMessage()).stop_reason === "refusal") throw new AiError("refused");
  } catch (error) {
    throw normalize(error);
  }
}
