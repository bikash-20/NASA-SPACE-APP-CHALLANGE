"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { colorForLevel } from "@/lib/colors";
import type { Crew, Level } from "@/lib/types";

const STEPS: {
  key: string;
  label: string;
  sub: string;
  tone: "ok" | "accent" | "neutral";
}[] = [
  { key: "sim", label: "Simulate", sub: "live", tone: "neutral" },
  { key: "base", label: "Baseline", sub: "ref", tone: "neutral" },
  { key: "ai", label: "AI score", sub: "advise", tone: "accent" },
  { key: "rules", label: "Rules", sub: "decide", tone: "ok" },
  { key: "alert", label: "Alert", sub: "raised", tone: "neutral" },
  { key: "brief", label: "Brief", sub: "by LLM", tone: "accent" },
];

interface PipelineProps {
  onStage: (n: number) => void;
  values: string[];
  selected?: Crew | null;
  aiOn?: boolean;
  activeCount?: number;
  briefReady?: boolean;
}

const toneColor = (tone: PipelineProps["values"] extends never ? never : "ok" | "accent" | "neutral", lv?: Level) => {
  if (tone === "ok") return "#10b981";
  if (tone === "accent") return "#7c5cff";
  if (lv !== undefined && lv > 0) return colorForLevel(lv);
  return "rgba(255,255,255,0.35)";
};

export function Pipeline({
  onStage,
  values,
  selected,
  aiOn = true,
  activeCount = 0,
  briefReady = false,
}: PipelineProps) {
  // Compute a per-step "color hint" from values; the dot uses the same color
  // family as the panel that step highlights, so the eye can follow the
  // click-to-highlight trail.
  const stepHints = (i: number): { dot: string; lv?: Level } => {
    if (i === 0) return { dot: toneColor("neutral") };
    if (i === 1 && selected) {
      // baseline is the reference, not the level
      return { dot: toneColor("neutral") };
    }
    if (i === 2) return { dot: aiOn ? toneColor("accent") : "var(--bad, #f43f5e)" };
    if (i === 3 && selected) {
      const mx = selected.r.reduce((m, v) => (v > m ? v : m), 0) as Level;
      return { dot: toneColor("ok", mx > 0 ? mx : undefined) };
    }
    if (i === 4) return { dot: activeCount > 0 ? "#f43f5e" : "rgba(255,255,255,0.35)" };
    if (i === 5) return { dot: briefReady ? toneColor("accent") : "rgba(255,255,255,0.35)" };
    return { dot: "rgba(255,255,255,0.35)" };
  };

  return (
    <ol
      className="snap-row flex w-full items-stretch gap-1.5 overflow-x-auto px-3 py-2 sm:gap-2 sm:px-5"
      aria-label="Pipeline"
    >
      {STEPS.map((s, i) => {
        const { dot } = stepHints(i);
        return (
          <li key={s.key} className="flex-1 min-w-[140px]">
            <motion.button
              whileHover={{ y: -1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => onStage(i + 1)}
              className={cn(
                "tappable group flex w-full flex-col items-stretch gap-1 rounded-lg border bg-white/[0.04] p-2 text-left",
                "border-white/10 hover:border-white/25"
              )}
              style={{ borderTopColor: dot, borderTopWidth: 3 }}
              aria-label={`Step ${i + 1}: ${s.label}`}
            >
              <div className="flex items-baseline justify-between gap-1.5">
                <span className="text-sm font-semibold text-ink">
                  {i + 1}. {s.label}
                </span>
                <span className="text-sm font-normal text-white/65">
                  {s.sub}
                </span>
              </div>
              <span className="block whitespace-normal break-words font-mono text-sm leading-tight tabular-nums text-white/80">
                {values[i] || "—"}
              </span>
            </motion.button>
          </li>
        );
      })}
    </ol>
  );
}
