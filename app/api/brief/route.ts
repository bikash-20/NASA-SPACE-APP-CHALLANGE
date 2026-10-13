import { NextRequest, NextResponse } from "next/server";
import { CascadeError, callCascade } from "@/lib/openrouter";
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

/**
 * Map cascade failure kinds to a small, user-friendly surface. The
 * discriminator (`code`) is consumed by the client to pick a specific
 * message instead of a generic "could not be generated".
 */
function briefErrorResponse(
  error: unknown
): NextResponse {
  if (error instanceof CascadeError) {
    switch (error.kind) {
      case "missing_api_key":
        console.error("[/api/brief] OPENROUTER_API_KEY is not set");
        return NextResponse.json(
          {
            code: "not_configured",
            error:
              "Brief service is not configured on the server. " +
              "Set OPENROUTER_API_KEY.",
          },
          { status: 503 }
        );
      case "auth":
        console.error("[/api/brief] upstream auth failed", {
          message: error.message,
        });
        return NextResponse.json(
          {
            code: "upstream_auth",
            error:
              "Brief service rejected the server's API key. " +
              "Check OPENROUTER_API_KEY.",
          },
          { status: 502 }
        );
      case "no_models":
        console.warn("[/api/brief] no models in cascade", {
          message: error.message,
        });
        return NextResponse.json(
          {
            code: "no_models",
            error:
              "No free models are available right now. " +
              "Set OPENROUTER_MAX_PRICE_PER_1K to widen the filter, or " +
              "pin a specific model with OPENROUTER_MODEL.",
          },
          { status: 503 }
        );
      case "catalog_unavailable":
        console.error("[/api/brief] model catalog unreachable", {
          message: error.message,
        });
        return NextResponse.json(
          {
            code: "catalog_unavailable",
            error:
              "Brief service cannot reach the model catalog. " +
              "Try again in a few minutes.",
          },
          { status: 503 }
        );
      case "all_failed":
        console.warn("[/api/brief] all cascade models failed");
        return NextResponse.json(
          {
            code: "all_failed",
            error:
              "All available models failed to respond. " +
              "Try again in a few minutes.",
          },
          { status: 503 }
        );
    }
  }
  console.error("[/api/brief] upstream service failed", error);
  return NextResponse.json(
    {
      code: "unknown",
      error: "The brief could not be generated. Please try again.",
    },
    { status: 503 }
  );
}

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
    return briefErrorResponse(e);
  }
}
