import type { Level } from "./types";

export const LEVEL_COLORS = {
  ok: "#22c55e",
  watch: "#fbbf24",
  bad: "#fb7185",
  accent: "#22d3ee",
  ink: "#e2e8f0",
} as const;

export function colorForLevel(lv: Level): string {
  return lv === 0 ? LEVEL_COLORS.ok : lv === 1 ? LEVEL_COLORS.watch : LEVEL_COLORS.bad;
}
