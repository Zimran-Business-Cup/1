import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NextResponse } from "next/server";
import { getProfession } from "@/lib/catalog";
import { demoTutor } from "@/lib/tutor/demo";
import { systemPrompt } from "@/lib/tutor/prompt";
import { MentorTurnSchema, TutorRequestSchema } from "@/lib/tutor/schema";
import { allow } from "@/lib/rate-limit";
import { attachTask } from "@/server/tasks/assign";

export const maxDuration = 60;

const MODEL = "claude-opus-5-5";

// Without a key the mentor runs in demo mode (see lib/tutor/demo.ts).
const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allow(ip)) {
    return NextResponse.json({ error: "Too many messages in a minute. Wait a moment and send again." }, { status: 429 });
  }

  const parsed = TutorRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "The request was malformed." }, { status: 400 });
  }
  const profession = getProfession(parsed.data.profession);
  if (!profession) {
    return NextResponse.json({ error: "Unknown role." }, { status: 404 });
  }

  const { history } = parsed.data;
  if (!client) {
    return NextResponse.json({ mode: "demo", turn: attachTask(profession.slug, history, demoTutor(profession, parsed.data)) });
  }

  // The API needs a user turn first; the session opens with the mentor speaking.
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: "[The learner opened this role's session.]" },
    ...parsed.data.history,
  ];

  try {
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 8000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: systemPrompt(profession), cache_control: { type: "ephemeral" } }],
      messages,
      output_config: { effort: "low", format: betaZodOutputFormat(MentorTurnSchema) },
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "The mentor can't help with that. Try rephrasing your message." }, { status: 422 });
    }
    if (!response.parsed_output) {
      return NextResponse.json({ error: "The mentor's reply was cut off. Send your message again." }, { status: 502 });
    }
    return NextResponse.json({ mode: "ai", turn: attachTask(profession.slug, history, response.parsed_output) });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "The mentor is busy right now. Try again in a few seconds." }, { status: 503 });
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "The server's AI key is invalid. Check ANTHROPIC_API_KEY." }, { status: 500 });
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `The AI service returned an error (${error.status}). Try again.` }, { status: 502 });
    }
    throw error;
  }
}
