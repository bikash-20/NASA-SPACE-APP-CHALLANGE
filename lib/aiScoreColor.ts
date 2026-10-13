import { LEVEL_COLORS } from "./colors";

/**
 * Display-only traffic-light color for the AI risk number.
 *
 * The threshold values here intentionally differ from those in
 * `lib/aiScore.ts:band()`. `band()` is what the LLM snapshot uses
 * (and what the brief and chat prompts see), so changing it would
 * be a behavior change for the model. The dashboard's color
 * treatment, on the other hand, is a UX decision that can be tuned
 * without affecting the model.
 *
 * - score < 40  -> green (stable)
 * - 40..70     -> amber (watch)
 * - score > 70 -> red   (alert)
 */
export function aiScoreDisplayColor(score: number): string {
  if (score < 40) return LEVEL_COLORS.ok;
  if (score <= 70) return LEVEL_COLORS.watch;
  return LEVEL_COLORS.bad;
}
