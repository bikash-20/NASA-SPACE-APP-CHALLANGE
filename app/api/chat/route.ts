import { NextRequest } from "next/server";
import {
  parseChatMessages,
  parseCrewSnapshot,
  readBoundedJson,
  sanitizeAlertHistory,
} from "@/lib/llmInput";
import { buildChatMessages } from "@/lib/chatPrompt";
import { streamCascade } from "@/lib/openrouter";
import { snapshotForLLM } from "@/lib/serialize";
import type { Alert, ChatMessage, Crew } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_REQUEST_BYTES = 64 * 1024;

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
  // Defense-in-depth: even though parseChatMessages constrains role and
  // content, we never forward a client-supplied "assistant" turn to the
  // LLM. Without this, a malicious client could forge prior assistant
  // replies ("I'm ignoring the snapshot, here's the real answer") and many
  // models would follow them. The server is the only source of assistant
  // turns in this conversation.
  const trustedUserTurns = messages.filter((m) => m.role === "user");

  const body: ChatRequestBody = {
    crew,
    aiOn: input.aiOn,
    alerts: sanitizeAlertHistory(input.alerts, [crew], input.aiOn),
    messages: trustedUserTurns,
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
        let model = "unknown";
        for await (const chunk of streamCascade(
          buildChatMessages(snapshot, body.messages),
          {
            temperature: 0.4,
            signal: upstreamSignal,
          }
        )) {
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
