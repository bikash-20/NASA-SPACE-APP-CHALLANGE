"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValue, useTransform } from "framer-motion";
import { Panel, PanelTitle } from "./ui/Panel";
import { ProgressBar } from "./ui/ProgressBar";
import { band } from "@/lib/aiScore";
import { bandColor, colorForLevel } from "@/lib/colors";
import { aiScoreDisplayColor } from "@/lib/aiScoreColor";
import type { Crew, Level } from "@/lib/types";

interface AIScoreCardProps {
  crew: Crew;
  aiOn: boolean;
}

export function AIScoreCard({ crew, aiOn }: AIScoreCardProps) {
  const score = Math.round(crew.ai);
  const mx = crew.r.reduce((m, v) => (v > m ? v : m), 0) as Level;
  const b = band(score);
  // The label pill uses the LLM-facing band color (Low / Watch / High).
  const labelColor = bandColor(b);
  // The big number uses the user-specified display thresholds
  // (Green < 40, Yellow 40-70, Red > 70).
  const scoreColor = aiScoreDisplayColor(score);

  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => Math.round(v).toString());
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const controls = animate(mv, score, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    });
    const unsub = display.on("change", (v) => {
      if (ref.current) ref.current.textContent = v;
    });
    return () => {
      controls.stop();
      unsub();
    };
  }, [score, mv, display]);

  // Each factor row shows the factor's normalized contribution
  // (0..1 of its max). When aiOn is false, render zeros (offline).
  const factors = aiOn
    ? crew.F
    : (crew.F.map(([name]) => [name, 0, 1] as [string, number, number]));

  return (
    <Panel tone="accent" density="compact" className="desktop-ai-score">
      <PanelTitle title="AI risk score" tone="accent" />
      {aiOn ? (
        <>
          <div className="flex items-baseline gap-3">
            <span
              ref={ref}
              data-ai-band={b.toLowerCase()}
              className="desktop-ai-number font-mono font-bold tabular-nums"
              style={{
                fontSize: "var(--fs-ai)",
                lineHeight: "var(--lh-display)",
                color: scoreColor,
              }}
            >
              {score}
            </span>
            <span className="desktop-ai-label text-sm text-white/65">
              of 100 ·{" "}
              <span
                className="rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider"
                style={{
                  color: labelColor,
                  borderColor: labelColor,
                  letterSpacing: "0.04em",
                }}
              >
                {b}
              </span>
            </span>
          </div>
          <ul className="desktop-ai-factors flex flex-col">
            {factors.map(([name, val, max]) => {
              const pct = max > 0 ? Math.min(100, (val / max) * 100) : 0;
              const tone = aiOn ? scoreColor : colorForLevel(0);
              return (
                <li
                  key={name}
                  className="desktop-ai-factor grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_auto] items-center gap-3"
                >
                  <span className="truncate text-sm text-white/75">{name}</span>
                  <ProgressBar value={pct} color={tone} height={8} />
                  <span className="font-mono text-sm tabular-nums text-white/65">
                    {Math.round(pct)}%
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="desktop-ai-advice text-sm text-white/65">
            <span className="lg:hidden">
              {mx === 0 && crew.ai >= 45
                ? "The AI sees a combined pattern no single rule caught. It's flagged for review, not raised as an alert."
                : "The score never raises an alert on its own. Rules do that."}
            </span>
            <span className="hidden lg:inline">Advises only. Rules decide.</span>
          </p>
        </>
      ) : (
        <>
          <ul className="desktop-ai-factors flex flex-col">
            {factors.map(([name]) => (
              <li
                key={name}
                className="desktop-ai-factor grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_auto] items-center gap-3"
              >
                <span className="truncate text-sm text-white/55">{name}</span>
                <ProgressBar value={0} color="rgba(255,255,255,0.18)" height={8} />
                <span className="font-mono text-sm tabular-nums text-white/45">
                  —
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-white/75">
            <b className="text-bad">Scorer offline.</b> Rules keep running, so
            alerts still fire.
          </p>
        </>
      )}
    </Panel>
  );
}
