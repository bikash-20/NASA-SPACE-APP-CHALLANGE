import { evalRules } from "./rules";
import { mkCrew } from "./simulation";
import type { Alert, ChatMessage, Crew } from "./types";

export type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413 };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export async function readBoundedJson(
  request: Request,
  maxBytes: number
): Promise<JsonBodyResult> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { ok: false, status: 413 };
  }
  if (!request.body) return { ok: false, status: 400 };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return { ok: false, status: 413 };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return {
      ok: true,
      value: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
    };
  } catch {
    return { ok: false, status: 400 };
  }
}

function boundedNumber(
  value: unknown,
  min: number,
  max: number
): number | null {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
    ? value
    : null;
}

function history(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number[] | null {
  if (!Array.isArray(value) || value.length > 60) return null;
  if (value.length === 0) return [fallback];
  const values: number[] = [];
  for (const entry of value) {
    const parsed = boundedNumber(entry, min, max);
    if (parsed === null) return null;
    values.push(parsed);
  }
  return values;
}

/** Rebuild a server-owned crew snapshot from bounded, untrusted browser data. */
export function parseCrewSnapshot(
  value: unknown,
  aiEnabled = true
): Crew | null {
  if (!isRecord(value) || (value.id !== 0 && value.id !== 1 && value.id !== 2)) {
    return null;
  }
  const rawHistory = value.H;
  const rawFlags = value.f;
  if (!isRecord(rawHistory) || !isRecord(rawFlags)) return null;

  const hr = boundedNumber(value.hr, 30, 220);
  const spo2 = boundedNumber(value.spo2, 70, 100);
  const sleep = boundedNumber(value.sleep, 0, 24);
  const stress = boundedNumber(value.stress, 0, 100);
  const dose = boundedNumber(value.dose, 0, 1_000_000);
  const rate = boundedNumber(value.rate, 0, 20);
  const ai = boundedNumber(value.ai, 0, 100);
  if (
    hr === null ||
    spo2 === null ||
    sleep === null ||
    stress === null ||
    dose === null ||
    rate === null ||
    ai === null ||
    (rawFlags.sleep !== 0 && rawFlags.sleep !== 1) ||
    (rawFlags.card !== 0 && rawFlags.card !== 1)
  ) {
    return null;
  }

  const member = mkCrew(value.id);
  const hrHistory = history(rawHistory.hr, hr, 30, 220);
  const spo2History = history(rawHistory.spo2, spo2, 70, 100);
  const stressHistory = history(rawHistory.stress, stress, 0, 100);
  const rateHistory = history(rawHistory.rate, rate, 0, 20);
  if (!hrHistory || !spo2History || !stressHistory || !rateHistory) {
    return null;
  }

  member.hr = hr;
  member.spo2 = spo2;
  member.sleep = sleep;
  member.stress = stress;
  member.dose = dose;
  member.rate = rate;
  member.f = { sleep: rawFlags.sleep, card: rawFlags.card };
  member.H = {
    hr: hrHistory,
    spo2: spo2History,
    stress: stressHistory,
    rate: rateHistory,
  };
  member.ai = aiEnabled ? ai : 0;
  member.R = evalRules(member);
  member.r = member.R.map((rule) => rule.lv);
  member.armed = member.r.map((level) => level === 0);
  return member;
}

export function parseChatMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length > 20) return null;
  const messages: ChatMessage[] = [];
  for (const valueMessage of value) {
    if (
      !isRecord(valueMessage) ||
      (valueMessage.role !== "user" && valueMessage.role !== "assistant") ||
      typeof valueMessage.content !== "string" ||
      valueMessage.content.trim().length === 0 ||
      valueMessage.content.length > 1200
    ) {
      return null;
    }
    messages.push({
      role: valueMessage.role,
      content: valueMessage.content.trim(),
    });
  }
  return messages;
}

const ALERT_TIME_PATTERN = /^Day \d{1,6} · (?:[01]\d|2[0-3]):[0-5]\d$/;

/** Keep only structured alert references; never forward client-authored prose. */
export function sanitizeAlertHistory(
  value: unknown,
  crew: Crew[],
  aiEnabled = true
): Alert[] {
  if (!Array.isArray(value)) return [];
  const validCrew = new Map(crew.map((member) => [member.id, member]));
  const result: Alert[] = [];

  for (const candidate of value.slice(0, 100)) {
    if (
      !isRecord(candidate) ||
      (candidate.i !== 0 && candidate.i !== 1 && candidate.i !== 2) ||
      typeof candidate.j !== "number" ||
      !Number.isInteger(candidate.j) ||
      candidate.j < 0 ||
      candidate.j >= 5 ||
      typeof candidate.t !== "string" ||
      !ALERT_TIME_PATTERN.test(candidate.t)
    ) {
      continue;
    }

    const member = validCrew.get(candidate.i);
    const rule = member?.R[candidate.j];
    if (!member || !rule || rule.lv === 0) continue;
    result.push({
      id: `snapshot-${result.length}`,
      t: candidate.t,
      i: member.id,
      j: candidate.j,
      n: rule.n,
      th: rule.th,
      lv: rule.lv,
      why: rule.why,
      ai: Math.round(member.ai),
      aiOn: aiEnabled,
    });
  }
  return result;
}
