/**
 * OpenRouter integration with a model cascade.
 *
 * On first use we fetch https://openrouter.ai/api/v1/models (no auth required
 * for the listing), score each chat-capable model, and cache the top 5 for
 * 10 minutes. Each request tries them in order with an 8s timeout, falling
 * through to the next on failure. 401/403 aborts the whole cascade because
 * the key is bad — retrying with the same key won't help.
 *
 * SERVER ONLY. Imported only by app/api/* route handlers.
 */

const ENDPOINT = "https://openrouter.ai/api/v1/models";
const CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const CACHE_TTL_MS = 10 * 60 * 1000;
// Free-tier models on OpenRouter are often slow to cold-start, especially
// for non-streaming requests. Keep this in sync with the streaming timeout
// so a brief that needs 600 tokens has the same wall-clock budget as a chat
// turn that streams 800.
const PER_REQUEST_TIMEOUT_MS = 16_000;

const PREFERRED_FAMILIES = [
  "llama",
  "qwen",
  "gemini",
  "deepseek",
  "glm",
  "mistral",
  "claude",
  "gpt",
  "command",
];

interface OpenRouterModel {
  id: string;
  name?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
}

let cascadeCache: { at: number; ids: string[] } | null = null;
let cascadeInflight: Promise<string[]> | null = null;

function isChatCapable(m: OpenRouterModel): boolean {
  const out = m.architecture?.output_modalities ?? [];
  if (out.length > 0) return out.includes("text");
  const modality = m.architecture?.modality ?? "";
  return modality.includes("text") || modality.includes("->text");
}

function isFree(m: OpenRouterModel): boolean {
  const prompt = m.pricing?.prompt;
  const completion = m.pricing?.completion;
  if (
    typeof prompt !== "string" ||
    typeof completion !== "string" ||
    prompt.trim() === "" ||
    completion.trim() === ""
  ) {
    return false;
  }
  const promptPrice = Number(prompt);
  const completionPrice = Number(completion);
  return (
    Number.isFinite(promptPrice) &&
    Number.isFinite(completionPrice) &&
    promptPrice === 0 &&
    completionPrice === 0
  );
}

function rank(m: OpenRouterModel): number {
  let score = 0;
  // Small-context models are usually the "flash" or "mini" variants and
  // respond much faster on the free tier. Prefer them so most requests
  // succeed on the first try instead of timing out on a heavyweight model
  // and falling through to one that would have answered.
  const ctx = m.context_length ?? 0;
  if (ctx > 0 && ctx < 16_000) score += 150;
  if (ctx >= 32_000) score += 50;
  const id = m.id.toLowerCase();
  if (PREFERRED_FAMILIES.some((f) => id.includes(f))) score += 50;
  // "flash", "mini", "lite", "small" suffixes are a strong signal of speed.
  if (/(?:^|[^a-z])(flash|mini|lite|small|nano)(?:[^a-z]|$)/.test(id)) {
    score += 80;
  }
  return score;
}

async function loadCascade(): Promise<string[]> {
  const res = await fetch(ENDPOINT, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    console.warn("[openrouter] model catalog failed", {
      category: "http_error",
      status: res.status,
    });
    throw new Error(`openrouter models list failed: ${res.status}`);
  }
  const data = (await res.json()) as { data?: OpenRouterModel[] };
  const list = (data.data ?? []).filter(
    (model) => isChatCapable(model) && isFree(model)
  );
  list.sort((a, b) => rank(b) - rank(a));
  const ids = list.slice(0, 5).map((m) => m.id);
  if (ids.length === 0) {
    console.error("[openrouter] model catalog has no free text models");
    throw new Error("openrouter returned no free text models");
  }
  return ids;
}

export async function getCascade(): Promise<string[]> {
  const now = Date.now();
  if (cascadeCache && now - cascadeCache.at < CACHE_TTL_MS) {
    return cascadeCache.ids;
  }
  if (cascadeInflight) return cascadeInflight;
  cascadeInflight = loadCascade()
    .then((ids) => {
      cascadeCache = { at: Date.now(), ids };
      return ids;
    })
    .catch((error: unknown) => {
      console.warn("[openrouter] model catalog failed", {
        category:
          error instanceof Error &&
          error.message === "openrouter returned no free text models"
            ? "no_free_text_models"
            : errorCategory(error),
      });
      throw error;
    })
    .finally(() => {
      cascadeInflight = null;
    });
  return cascadeInflight;
}

export interface CascadeMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CascadeOpts {
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

function logStreamFailure(
  model: string,
  category: string,
  status?: number
): void {
  console.warn("[openrouter] stream attempt failed", {
    model,
    category,
    ...(status === undefined ? {} : { status }),
  });
}

function errorCategory(error: unknown): string {
  if (!(error instanceof Error)) return "unknown";
  if (error.name === "AbortError" || error.name === "TimeoutError") {
    return "timeout";
  }
  return "network_or_stream_error";
}

class PartialStreamError extends Error {}

/** One non-streaming cascade call. Returns the text + which model served. */
export async function callCascade(
  messages: CascadeMessage[],
  opts: CascadeOpts = {}
): Promise<{ text: string; model: string }> {
  opts.signal?.throwIfAborted();
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("[openrouter] request configuration failed", {
      category: "missing_api_key",
    });
    throw new Error("OPENROUTER_API_KEY is not set on the server");
  }
  const ids = await getCascade();

  for (const model of ids) {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      PER_REQUEST_TIMEOUT_MS
    );
    const composite = opts.signal
      ? AbortSignal.any([controller.signal, opts.signal])
      : controller.signal;
    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://crew-health-monitor.vercel.app",
          "X-Title": "Crew Health Monitor",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: opts.temperature ?? 0.4,
          max_tokens: opts.maxTokens ?? 600,
          stream: false,
        }),
        signal: composite,
      });

      if (res.status === 401 || res.status === 403) {
        throw new Error(
          `openrouter auth failed (${res.status}) — check OPENROUTER_API_KEY`
        );
      }
      if (!res.ok) {
        console.warn("[openrouter] model failed", model, res.status);
        continue;
      }
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = json.choices?.[0]?.message?.content?.trim();
      if (!text) {
        continue;
      }
      console.log("[openrouter] served by:", model);
      return { text, model };
    } catch (err) {
      if (opts.signal?.aborted) throw err;
      if (err instanceof Error && err.message.startsWith("openrouter auth")) {
        throw err;
      }
      continue;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("all cascade models failed");
}

/**
 * Streaming cascade. Yields raw text deltas. Uses OpenAI-style SSE format.
 * The route handler is responsible for converting those to its own wire format.
 */
export async function* streamCascade(
  messages: CascadeMessage[],
  opts: CascadeOpts = {}
): AsyncGenerator<{ delta: string; model: string }> {
  opts.signal?.throwIfAborted();
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("[openrouter] chat configuration failed", {
      category: "missing_api_key",
    });
    throw new Error("OPENROUTER_API_KEY is not set on the server");
  }
  const ids = await getCascade();

  for (const model of ids) {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      PER_REQUEST_TIMEOUT_MS * 2
    );
    const signal = opts.signal
      ? AbortSignal.any([controller.signal, opts.signal])
      : controller.signal;
    let receivedDelta = false;
    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://crew-health-monitor.vercel.app",
          "X-Title": "Crew Health Monitor",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: opts.temperature ?? 0.5,
          max_tokens: opts.maxTokens ?? 800,
          stream: true,
        }),
        signal,
      });

      if (res.status === 401 || res.status === 403) {
        console.warn("[openrouter] stream attempt failed", {
          model,
          category: "authentication",
          status: res.status,
        });
        throw new Error(`openrouter auth failed (${res.status})`);
      }
      if (!res.ok || !res.body) {
        logStreamFailure(
          model,
          res.body ? "http_error" : "missing_response_body",
          res.body ? res.status : undefined
        );
        continue;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamDone = false;
      let failureCategory: string | null = null;
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          buffer += decoder.decode();
          if (buffer) buffer += "\n";
        } else {
          buffer += decoder.decode(value, { stream: true });
        }
        const lines = buffer.split("\n");
        buffer = done ? "" : lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") {
            streamDone = true;
            break;
          }
          try {
            const parsed = JSON.parse(payload) as {
              error?: unknown;
              choices?: { delta?: { content?: string } }[];
            };
            if (parsed.error) {
              failureCategory = "upstream_sse_error";
              break;
            }
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              receivedDelta = true;
              yield { delta, model };
            }
          } catch {
            failureCategory = "malformed_sse";
            break;
          }
        }
        if (failureCategory || streamDone || done) break;
      }
      if (failureCategory) {
        await reader.cancel();
        logStreamFailure(model, failureCategory);
        if (receivedDelta) {
          throw new PartialStreamError(
            "OpenRouter stream failed after partial output"
          );
        }
        continue;
      }
      if (!streamDone) {
        logStreamFailure(model, "incomplete_stream");
        if (receivedDelta) {
          throw new PartialStreamError(
            "OpenRouter stream failed after partial output"
          );
        }
        continue;
      }
      if (!receivedDelta) {
        logStreamFailure(model, "empty_stream");
        continue;
      }
      if (streamDone) await reader.cancel();
      console.log("[openrouter] stream completed by:", model);
      return;
    } catch (err) {
      if (opts.signal?.aborted) throw err;
      if (err instanceof Error && err.message.startsWith("openrouter auth")) {
        throw err;
      }
      if (err instanceof PartialStreamError) {
        throw err;
      }
      logStreamFailure(model, errorCategory(err));
      if (receivedDelta) {
        throw new PartialStreamError(
          "OpenRouter stream failed after partial output"
        );
      }
      continue;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("all cascade models failed");
}
