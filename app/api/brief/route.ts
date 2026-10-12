import { NextRequest, NextResponse } from "next/server";
import { callCascade } from "@/lib/openrouter";
import { parseCrewSnapshot, readBoundedJson } from "@/lib/llmInput";
import { snapshotForLLM } from "@/lib/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_REQUEST_BYTES = 24 * 1024;

const SYSTEM_PROMPT = `You are a concise assistant for an educational crew-health simulation, not a real flight surgeon. You receive a structured synthetic snapshot of one crew member and produce a concise simulation brief.

Hard rules:
- Use ONLY the data in the snapshot. Never invent values, names, or events.
- If a value is missing, omit it rather than guess.
- Plain English. No emojis. No exclamations.
- Markdown output with exactly three sections:
  1. **Status** — one line, the worst current condition.
  2. **Active concerns** — bulleted list, omit section if none.
  3. **Suggested next step** — one or two non-clinical review steps, such as checking rule evidence or consulting an applicable protocol; if no rule concerns exist, say "no simulation follow-up indicated."
- Do NOT diagnose, recommend treatment, raise new alerts, or contradict the rules engine. The values are synthetic and are not medical guidance.`;

export async function POST(req: NextRequest) {
  const parsed = await readBoundedJson(req, MAX_REQUEST_BYTES);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.status === 413 ? "request too large" : "invalid request" },
      { status: parsed.status }
    );
  }
  if (
    typeof parsed.value !== "object" ||
    parsed.value === null ||
    Array.isArray(parsed.value)
  ) {
    return NextResponse.json({ error: "invalid crew snapshot" }, { status: 400 });
  }
  const input = parsed.value as Record<string, unknown>;
  if (typeof input.aiOn !== "boolean") {
    return NextResponse.json({ error: "invalid scorer state" }, { status: 400 });
  }
  const crew = parseCrewSnapshot(input.crew, input.aiOn);
  if (!crew) {
    return NextResponse.json({ error: "invalid crew snapshot" }, { status: 400 });
  }

  try {
    const snapshot = snapshotForLLM(crew, [], input.aiOn);
    const { text, model } = await callCascade([
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Write the brief for the following crew member.\n\n${snapshot}`,
      },
    ]);
    return NextResponse.json({ text, model });
  } catch (e) {
    console.error("[/api/brief] upstream service failed", e);
    return NextResponse.json(
      { error: "brief service temporarily unavailable" },
      { status: 503 }
    );
  }
}
