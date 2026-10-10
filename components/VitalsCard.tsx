"use client";

import { Panel, PanelTitle } from "./ui/Panel";
import { Sparkline } from "./ui/Sparkline";
import { ProgressBar } from "./ui/ProgressBar";
import { colorForLevel } from "@/lib/colors";
import type { Crew, Level } from "@/lib/types";

interface VitalsCardProps {
  crew: Crew;
}

const DOSE_LIMIT = 250;

export function VitalsCard({ crew }: VitalsCardProps) {
  const r = crew.R;
  const col = (i: number): string => (r[i] ? colorForLevel(r[i].lv as Level) : "#10b981");

  const dosePct = (crew.dose / DOSE_LIMIT) * 100;
  const doseOver = dosePct > 100;
  const sleepPct = (crew.sleep / 9) * 100;

  return (
    <Panel>
      <PanelTitle
        title={`${crew.n} — live vitals`}
        hint={crew.role}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Tile
          label="Heart rate"
          big={Math.round(crew.hr)}
          unit="bpm"
          sub={`Baseline ${crew.bhr} bpm. Dashed line = alert threshold (+30%).`}
          tone={col(0)}
        >
          <Sparkline
            data={crew.H.hr}
            threshold={crew.bhr * 1.3}
            color={col(0)}
            yMin={crew.bhr * 0.8}
            yMax={crew.bhr * 1.9}
          />
        </Tile>
        <Tile
          label="Blood oxygen"
          big={crew.spo2.toFixed(1)}
          unit="%"
          sub="Alert below 90% · Watch below 94%."
          tone={col(1)}
        >
          <Sparkline
            data={crew.H.spo2}
            threshold={94}
            color={col(1)}
            yMin={88}
            yMax={100}
          />
        </Tile>
        <Tile
          label="Sleep, 3-night average"
          big={crew.sleep.toFixed(1)}
          unit="h"
          sub="Alert below 4.5 h · Watch below 5.5 h."
          tone={col(2)}
        >
          <ProgressBar
            value={sleepPct}
            color={col(2)}
            marks={[61, 50]}
            height={10}
          />
        </Tile>
        <Tile
          label="Stress index"
          big={Math.round(crew.stress)}
          unit="/ 100"
          sub="Alert above 90 · Watch above 75."
          tone={col(3)}
        >
          <Sparkline
            data={crew.H.stress}
            threshold={75}
            color={col(3)}
            yMin={0}
            yMax={100}
          />
        </Tile>
        <div className="sm:col-span-2">
          <Tile
            label="Radiation, 30-day dose"
            big={Math.round(crew.dose)}
            unit={`/ ${DOSE_LIMIT} mSv`}
            sub={
              doseOver
                ? `Over limit — ${Math.round(dosePct)}% of ${DOSE_LIMIT} mSv. Rate ${crew.rate.toFixed(2)} mSv/h.`
                : `${Math.round(dosePct)}% of ${DOSE_LIMIT} mSv · rate ${crew.rate.toFixed(2)} mSv/h. Marks at 80% and 95%.`
            }
            tone={col(4)}
            badge={doseOver ? "Over" : null}
          >
            <ProgressBar
              value={dosePct}
              color={col(4)}
              marks={[80, 95]}
              height={10}
            />
            <div className="mt-2">
              <Sparkline
                data={crew.H.rate}
                threshold={1}
                color={col(4)}
                yMin={0}
                yMax={4}
                height={40}
              />
            </div>
          </Tile>
        </div>
      </div>
    </Panel>
  );
}

function Tile({
  label,
  big,
  unit,
  sub,
  children,
  tone,
  badge,
}: {
  label: string;
  big: string | number;
  unit: string;
  sub: string;
  children: React.ReactNode;
  tone: string;
  badge?: string | null;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium text-white/70">{label}</div>
        {badge && (
          <span
            className="rounded-full px-2.5 py-0.5 text-sm font-semibold text-white"
            style={{ background: tone }}
          >
            {badge}
          </span>
        )}
      </div>
      <div
        className="mt-1 font-mono font-bold tabular-nums text-ink"
        style={{ fontSize: "var(--fs-vital)", lineHeight: "var(--lh-display)" }}
      >
        {big}
        <span className="ml-1 text-sm font-normal text-white/55">{unit}</span>
      </div>
      <div className="mt-2">{children}</div>
      <div className="mt-2 text-sm text-white/65">{sub}</div>
    </div>
  );
}
