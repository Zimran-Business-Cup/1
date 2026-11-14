export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface JsonRequest {
  /** Schema name sent to providers that ask for one. */
  name: string;
  system: string;
  /** Starts with a user turn. */
  messages: ChatMessage[];
}

export interface StreamRequest {
  system: string;
  /** Alternating turns that end with the assistant. */
  history: ChatMessage[];
  question: { text: string; jpegBase64?: string };
}

type AiErrorKind = "busy" | "auth" | "refused" | "invalid" | "upstream";

/** Provider failures in one shape, so routes map them to responses without knowing the provider. */
export class AiError extends Error {
  constructor(
    readonly kind: AiErrorKind,
    readonly upstreamStatus?: number,
  ) {
    super(upstreamStatus ? `${kind} (${upstreamStatus})` : kind);
  }
}
