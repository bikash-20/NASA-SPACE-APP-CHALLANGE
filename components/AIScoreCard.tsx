"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Panel, PanelTitle } from "./ui/Panel";
import { ProgressBar } from "./ui/ProgressBar";
import { band } from "@/lib/aiScore";
import { colorForLevel } from "@/lib/colors";
import type { Crew, Level } from "@/lib/types";

interface AIScoreCardProps {
  crew: Crew;
  aiOn: boolean;
}

export function AIScoreCard({ crew, aiOn }: AIScoreCardProps) {
  const score = Math.round(crew.ai);
  const mx = crew.r.reduce((m, v) => (v > m ? v : m), 0) as Level;

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

  return (
    <Panel tone="accent" density="compact" className="desktop-ai-score">
      <PanelTitle title="AI risk score" tone="accent" />
      {aiOn ? (
        <>
          <div className="flex items-baseline gap-2">
            <span
              ref={ref}
              className="desktop-ai-number font-mono font-bold tabular-nums text-accent"
              style={{
                fontSize: "var(--fs-ai)",
                lineHeight: "var(--lh-display)",
              }}
            >
              {score}
            </span>
            <span className="desktop-ai-label text-sm text-white/65">
              of 100 · {band(score)}
            </span>
          </div>
          <div className="desktop-ai-factors mt-3 space-y-1.5">
            {crew.F.map(([name, val, max]) => (
              <div
                key={name}
                className="desktop-ai-factor grid grid-cols-[7.5rem_1fr] items-center gap-2 text-sm text-white/75"
              >
                <span className="truncate">{name}</span>
                <ProgressBar
                  value={(val / max) * 100}
                  color="#7c5cff"
                  height={6}
                />
              </div>
            ))}
          </div>
          <p className="desktop-ai-advice mt-3 text-sm text-white/65">
            <span className="lg:hidden">
              {mx === 0 && crew.ai >= 45
                ? "The AI sees a combined pattern no single rule caught. It's flagged for review, not raised as an alert."
                : "The score never raises an alert on its own. Rules do that."}
            </span>
            <span className="hidden lg:inline">
              Advises only. Rules decide.
            </span>
          </p>
        </>
      ) : (
        <p className="text-sm text-white/75">
          <b className="text-bad">Scorer offline.</b> Rules keep running, so
          alerts still fire.
        </p>
      )}
    </Panel>
  );
}
