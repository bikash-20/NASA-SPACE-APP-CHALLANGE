"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValue, useTransform } from "framer-motion";
import { Panel, PanelTitle } from "./ui/Panel";
import { RadarChart } from "./ui/RadarChart";
import { band } from "@/lib/aiScore";
import { bandColor, colorForLevel } from "@/lib/colors";
import type { Crew, Level } from "@/lib/types";

interface AIScoreCardProps {
  crew: Crew;
  aiOn: boolean;
}

export function AIScoreCard({ crew, aiOn }: AIScoreCardProps) {
  const score = Math.round(crew.ai);
  const mx = crew.r.reduce((m, v) => (v > m ? v : m), 0) as Level;
  const b = band(score);
  const scoreColor = bandColor(b);

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

  // The radar axes. Each axis is the factor's normalized contribution
  // (0..1) where 1 means the factor is at the top of its allotted weight.
  // We cap to 1.0 so a single bad reading can't make the polygon explode
  // off the chart.
  const radarData = aiOn
    ? crew.F.map(([name, val, max]) => ({
        axis: name,
        value: Math.min(1, max > 0 ? val / max : 0),
      }))
    : [
        { axis: "Heart rate", value: 0 },
        { axis: "Oxygen", value: 0 },
        { axis: "Sleep", value: 0 },
        { axis: "Stress", value: 0 },
        { axis: "Radiation", value: 0 },
      ];

  return (
    <Panel tone="accent" density="compact" className="desktop-ai-score">
      <PanelTitle title="AI risk score" tone="accent" />
      {aiOn ? (
        <>
          <div className="flex items-baseline gap-2">
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
                className="rounded-full border px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider"
                style={{
                  color: scoreColor,
                  borderColor: scoreColor,
                  letterSpacing: "0.04em",
                }}
              >
                {b}
              </span>
            </span>
          </div>
          <div className="desktop-ai-factors mt-2">
            <RadarChart data={radarData} color={scoreColor} height={150} />
          </div>
          <p className="desktop-ai-advice mt-2 text-sm text-white/65">
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
          <div className="desktop-ai-factors mt-2">
            <RadarChart
              data={radarData}
              color={colorForLevel(0)}
              height={150}
              offline
            />
          </div>
          <p className="mt-2 text-sm text-white/75">
            <b className="text-bad">Scorer offline.</b> Rules keep running, so
            alerts still fire.
          </p>
        </>
      )}
    </Panel>
  );
}
