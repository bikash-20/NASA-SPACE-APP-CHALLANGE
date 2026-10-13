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

/** Traffic-light color for an AI risk band ("Low" / "Watch" / "High"). */
export function bandColor(band: "Low" | "Watch" | "High"): string {
  if (band === "Low") return LEVEL_COLORS.ok;
  if (band === "Watch") return LEVEL_COLORS.watch;
  return LEVEL_COLORS.bad;
}
