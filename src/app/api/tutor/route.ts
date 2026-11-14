import { NextResponse } from "next/server";
import { getProfession } from "@/lib/catalog";
import { demoTutor } from "@/lib/tutor/demo";
import { systemPrompt } from "@/lib/tutor/prompt";
import { MentorTurnSchema, TutorRequestSchema, type MentorTurn } from "@/lib/tutor/schema";
import { allow } from "@/lib/rate-limit";
import { AiError, aiProvider, generateJson, type ChatMessage } from "@/server/ai";
import { saveProfile } from "@/server/db/repo";
import { userId } from "@/server/identity";
import { attachTask } from "@/server/tasks/assign";

export const maxDuration = 60;

const AI_ERRORS: Record<AiError["kind"], [number, string]> = {
  busy: [503, "The mentor is busy right now. Try again in a few seconds."],
  auth: [500, "The server's AI key is invalid. Check the keys in deploy/.env."],
  refused: [422, "The mentor can't help with that. Try rephrasing your message."],
  invalid: [502, "The mentor's reply was cut off. Send your message again."],
  upstream: [502, "The AI service returned an error. Try again."],
};

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
  const uid = await userId();
  // Attach the task card and, on the turn that ends the interview, store the profile.
  const reply = async (mode: "ai" | "demo", mentor: MentorTurn) => {
    const turn = attachTask(profession.slug, history, mentor);
    if (turn.task && turn.profile) await saveProfile(uid, profession.slug, turn.profile, turn.level);
    return NextResponse.json({ mode, turn });
  };

  // Without a model key the mentor runs in demo mode (see lib/tutor/demo.ts).
  if (!aiProvider) return reply("demo", demoTutor(profession, parsed.data));

  // The API needs a user turn first; the session opens with the mentor speaking.
  const messages: ChatMessage[] = [{ role: "user", content: "[The learner opened this role's session.]" }, ...history];

  try {
    const mentor = await generateJson(MentorTurnSchema, { name: "mentor_turn", system: systemPrompt(profession), messages });
    return reply("ai", mentor);
  } catch (error) {
    if (!(error instanceof AiError)) throw error;
    const [status, message] = AI_ERRORS[error.kind];
    return NextResponse.json({ error: message }, { status });
  }
}
