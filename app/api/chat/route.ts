import { NextRequest } from "next/server";
import {
  parseChatMessages,
  parseCrewSnapshot,
  readBoundedJson,
  sanitizeAlertHistory,
} from "@/lib/llmInput";
import { streamCascade } from "@/lib/openrouter";
import { snapshotForLLM } from "@/lib/serialize";
import type { Alert, ChatMessage, Crew } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_REQUEST_BYTES = 64 * 1024;

const SYSTEM_PROMPT = `You are a concise assistant for an educational crew-health simulation, not a real flight surgeon. You answer follow-up questions about one crew member's synthetic snapshot, provided in the first user message.

Hard rules:
- Use ONLY the data in the snapshot. If a value is needed but not present, say "not enough data" — never invent.
- Plain English. No emojis. No exclamation marks. Be terse.
- If the user asks about something unrelated to the snapshot, politely redirect.
- Do NOT diagnose, recommend treatment, raise new alerts, or contradict the rules engine. You may explain what the rules already decided.
- The values are synthetic and are not medical guidance. Direct real medical concerns to a qualified professional.`;

interface ChatRequestBody {
  crew: Crew;
  aiOn: boolean;
  alerts: Alert[];
  messages: ChatMessage[];
}

export async function POST(req: NextRequest) {
  const parsed = await readBoundedJson(req, MAX_REQUEST_BYTES);
  if (!parsed.ok) {
    return Response.json(
      { error: parsed.status === 413 ? "request too large" : "invalid request" },
      { status: parsed.status }
    );
  }
  if (
    typeof parsed.value !== "object" ||
    parsed.value === null ||
    Array.isArray(parsed.value)
  ) {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }

  const input = parsed.value as Record<string, unknown>;
  if (typeof input.aiOn !== "boolean") {
    return Response.json({ error: "invalid scorer state" }, { status: 400 });
  }
  const crew = parseCrewSnapshot(input.crew, input.aiOn);
  const messages = parseChatMessages(input.messages);
  if (!crew || !messages) {
    return Response.json({ error: "invalid chat request" }, { status: 400 });
  }
  const body: ChatRequestBody = {
    crew,
    aiOn: input.aiOn,
    alerts: sanitizeAlertHistory(input.alerts, [crew], input.aiOn),
    messages,
  };
  const snapshot = snapshotForLLM(body.crew, body.alerts, body.aiOn);
  const encoder = new TextEncoder();
  const upstreamController = new AbortController();
  const upstreamSignal = AbortSignal.any([
    req.signal,
    upstreamController.signal,
  ]);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messages: {
          role: "system" | "user" | "assistant";
          content: string;
        }[] = [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Crew snapshot (reference for the rest of this conversation):\n\n${snapshot}`,
          },
          {
            role: "assistant",
            content: "Understood. I have the snapshot. What would you like to know?",
          },
          ...body.messages.map(
            (message): { role: "user" | "assistant"; content: string } => ({
              role: message.role,
              content: message.content,
            })
          ),
        ];

        let model = "unknown";
        for await (const chunk of streamCascade(messages, {
          temperature: 0.4,
          signal: upstreamSignal,
        })) {
          model = chunk.model;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ delta: chunk.delta, model })}\n\n`
            )
          );
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch {
        if (!upstreamSignal.aborted) {
          console.error("[/api/chat] upstream service failed");
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "chat service temporarily unavailable" })}\n\n`
            )
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      }
    },
    cancel() {
      upstreamController.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
