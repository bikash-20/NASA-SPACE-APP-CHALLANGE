"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { colorForLevel } from "@/lib/colors";
import { Sparkline } from "./ui/Sparkline";
import { LEVEL_NAMES } from "@/lib/types";
import type { Crew, Level } from "@/lib/types";

interface CrewListProps {
  crew: Crew[];
  selected: 0 | 1 | 2;
  aiOn: boolean;
  onPick: (i: 0 | 1 | 2) => void;
  /** "rail" = vertical cards (lg+), "row" = horizontal compact (md), "pills" = segmented control (sm) */
  variant: "rail" | "row" | "pills";
  /** Optional cause hint per crew (e.g. "radiation") to suffix on Alert pills. */
  causes?: (string | null)[];
}

function worstLevel(c: Crew): Level {
  return c.r.reduce((m, v) => (v > m ? v : m), 0) as Level;
}

function statusDot(c: Crew, aiOn: boolean) {
  const w = worstLevel(c);
  return { color: colorForLevel(w), label: LEVEL_NAMES[w], w };
}

/** "Alert" -> "Alert · radiation" when cause provided, else just "Alert". */
function pillText(label: string, cause: string | null | undefined): string {
  if (!cause || label === "Stable") return label;
  return `${label} · ${cause}`;
}

export function CrewList({ crew, selected, aiOn, onPick, variant, causes }: CrewListProps) {
  if (variant === "pills") {
    return (
      <div
        role="tablist"
        aria-label="Select crew member"
        className="flex w-full items-stretch gap-1.5 px-3 py-2 sm:px-5"
      >
        {crew.map((c, i) => {
          const { color, label, w: wLevel } = statusDot(c, aiOn);
          const cause = causes?.[i] ?? null;
          const text = pillText(label, cause);
          const isSel = i === selected;
          return (
            <motion.button
              key={c.id}
              role="tab"
              aria-selected={isSel}
              onClick={() => onPick(i as 0 | 1 | 2)}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "tappable flex flex-1 items-center justify-center gap-2 rounded-lg border px-2 py-2 text-sm font-medium",
                isSel
                  ? "border-ink/40 bg-white/[0.06] text-ink"
                  : "border-white/10 bg-white/[0.02] text-white/70"
              )}
            >
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: color }}
              />
              <span className="truncate">{c.n.replace(/^(Cdr\.|Dr\.|Eng\.)\s/, "")}</span>
              <span className="sr-only">{text} (level {wLevel})</span>
            </motion.button>
          );
        })}
      </div>
    );
  }

  if (variant === "row") {
    return (
      <div className="grid grid-cols-3 gap-2 px-3 py-2 sm:px-5 md:grid-cols-3">
        {crew.map((c, i) => {
          const { color, label } = statusDot(c, aiOn);
          const cause = causes?.[i] ?? null;
          const text = pillText(label, cause);
          const isSel = i === selected;
          return (
            <motion.button
              key={c.id}
              onClick={() => onPick(i as 0 | 1 | 2)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "tappable flex items-center justify-between gap-2 rounded-lg border p-2 text-left",
                isSel
                  ? "border-ink/40 bg-white/[0.06]"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
              )}
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink">
                  {c.n}
                </div>
                <div className="truncate text-sm text-white/65">{c.role}</div>
              </div>
              <span
                className="shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-semibold text-white"
                style={{ background: color }}
              >
                {text}
              </span>
            </motion.button>
          );
        })}
      </div>
    );
  }

  // rail (desktop)
  return (
    <div className="desktop-crew-list flex flex-col gap-3">
      {crew.map((c, i) => {
        const { color, label } = statusDot(c, aiOn);
        const cause = causes?.[i] ?? null;
        // Per the design spec, the rail card's status pill shows the
        // pure status label (no cause suffix). The cause is still
        // available in the data for accessibility / sr-only text.
        const pill = label;
        const isSel = i === selected;
        return (
          <motion.button
            key={c.id}
            onClick={() => onPick(i as 0 | 1 | 2)}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              "tappable relative flex w-full flex-col gap-2 overflow-hidden rounded-xl border p-4 text-left",
              isSel
                ? "border-ink/40 bg-white/[0.05]"
                : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
            )}
            style={
              isSel
                ? { boxShadow: `inset 4px 0 0 ${color}` }
                : undefined
            }
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <b className="block text-base font-semibold text-ink">
                  {c.n}
                </b>
              </div>
              <span
                className="shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold text-white"
                style={{ background: color }}
              >
                {pill}
              </span>
            </div>
            <div className="desktop-crew-details text-sm text-white/75">
              <span>{c.role}</span>
              <span aria-hidden> · </span>
              <span className="font-mono tabular-nums">
                {aiOn ? `AI ${Math.round(c.ai)}` : "AI off"} · HR{" "}
                {Math.round(c.hr)} · SpO2 {c.spo2.toFixed(0)}
              </span>
            </div>
            <div className="desktop-crew-sparkline mt-auto w-full">
              <Sparkline
                data={c.H.hr.slice(-30)}
                color={color}
                height={40}
                compact
              />
            </div>
            {cause && <span className="sr-only">{cause}</span>}
          </motion.button>
        );
      })}
    </div>
  );
}
