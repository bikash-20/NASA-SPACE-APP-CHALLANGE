"use client";

import { Panel, PanelTitle } from "./ui/Panel";
import { Sparkline } from "./ui/Sparkline";
import { ProgressBar } from "./ui/ProgressBar";
import { BarChart } from "./ui/BarChart";
import { colorForLevel } from "@/lib/colors";
import type { Crew, Level } from "@/lib/types";

interface VitalsCardProps {
  crew: Crew;
}

const DOSE_LIMIT = 250;

export function VitalsCard({ crew }: VitalsCardProps) {
  const r = crew.R;
  const col = (i: number): string => (r[i] ? colorForLevel(r[i].lv as Level) : "#10b981");
  const levelOf = (i: number): "ok" | "watch" | "bad" => {
    const lv = r[i]?.lv ?? 0;
    return lv === 0 ? "ok" : lv === 1 ? "watch" : "bad";
  };

  const dosePct = (crew.dose / DOSE_LIMIT) * 100;
  const doseOver = dosePct > 100;
  const doseWatch = dosePct >= 80;

  return (
    <Panel
      className="desktop-vitals"
      data-dose-level={
        doseOver ? "bad" : doseWatch ? "watch" : "ok"
      }
    >
      <PanelTitle
        title={`${crew.n} — current vitals`}
        hint={crew.role}
      />
      <div className="flex flex-col gap-4">
        <div
          className="vitals-grid grid grid-cols-2 gap-4"
          data-vitals-grid
        >
          <Tile
            label="Heart rate"
            desktopLabel="Heart rate"
            big={Math.round(crew.hr)}
            unit="bpm"
            sub={`Baseline ${crew.bhr} bpm. Normal band 60 to +30%.`}
            desktopSub={`Base ${crew.bhr} · 60–${Math.round(crew.bhr * 1.3)}`}
            tone={col(0)}
          >
            <Sparkline
              data={crew.H.hr}
              threshold={crew.bhr * 1.3}
              color={col(0)}
              yMin={crew.bhr * 0.8}
              yMax={crew.bhr * 1.9}
              normalBand={[60, crew.bhr * 1.3]}
              levelColor={levelOf(0)}
              height={64}
              strokeWidth={3}
            />
          </Tile>
          <Tile
            label="Blood oxygen"
            desktopLabel="Blood oxygen"
            big={crew.spo2.toFixed(1)}
            unit="%"
            sub="Normal band 94% to 100%. Alert below 90%."
            desktopSub="Normal 94–100%"
            tone={col(1)}
          >
            <Sparkline
              data={crew.H.spo2}
              threshold={94}
              color={col(1)}
              yMin={88}
              yMax={100}
              normalBand={[94, 100]}
              levelColor={levelOf(1)}
              height={64}
              strokeWidth={3}
            />
          </Tile>
          <Tile
            label="Sleep, 3-night average"
            desktopLabel="Sleep, 3-night avg"
            big={crew.sleep.toFixed(1)}
            unit="h"
            sub="Alert below 4.5 h · Watch below 5.5 h."
            desktopSub="Base 7.2 · <5.5 h"
            tone={col(2)}
          >
            <BarChart
              data={crew.H.sleep}
              height={80}
              baseline={7.2}
              watch={5.5}
              alert={4.5}
              ariaLabel="7-night sleep history, newest on the right"
            />
          </Tile>
          <Tile
            label="Stress index"
            desktopLabel="Stress index"
            big={Math.round(crew.stress)}
            unit="/ 100"
            sub="Normal band 0 to 75. Alert above 90."
            desktopSub="Normal 0–75"
            tone={col(3)}
          >
            <Sparkline
              data={crew.H.stress}
              threshold={75}
              color={col(3)}
              yMin={0}
              yMax={100}
              normalBand={[0, 75]}
              levelColor={levelOf(3)}
              height={64}
              strokeWidth={3}
            />
          </Tile>
        </div>
        <div className="radiation-row">
          <Tile
            label="Radiation, 30-day dose"
            desktopLabel="Radiation"
            big={Math.round(crew.dose)}
            unit={`/ ${DOSE_LIMIT} mSv`}
            sub={
              doseOver
                ? `Over limit — ${Math.round(dosePct)}% of ${DOSE_LIMIT} mSv. Rate ${crew.rate.toFixed(2)} mSv/h.`
                : `${Math.round(dosePct)}% of ${DOSE_LIMIT} mSv · rate ${crew.rate.toFixed(2)} mSv/h. Threshold marks at 80% and 95%.`
            }
            desktopSub={`Rate ${crew.rate.toFixed(2)} mSv/h · marks 80/95%`}
            tone={col(4)}
            badge={doseOver ? "Over" : doseWatch ? "Watch" : null}
            dose
          >
            <ProgressBar
              value={dosePct}
              color={col(4)}
              marks={[80, 95]}
              showLabels
              height={16}
            />
            <div className="mt-3 desktop-dose-rate">
              <Sparkline
                data={crew.H.rate}
                threshold={1}
                color={col(4)}
                yMin={0}
                yMax={4}
                height={32}
                strokeWidth={2}
                levelColor={levelOf(4)}
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
  desktopLabel,
  big,
  unit,
  sub,
  desktopSub,
  children,
  tone,
  badge,
  dose = false,
}: {
  label: string;
  desktopLabel: string;
  big: string | number;
  unit: string;
  sub: string;
  desktopSub: string;
  children: React.ReactNode;
  tone: string;
  badge?: string | null;
  dose?: boolean;
}) {
  return (
    <div
      className={`desktop-vital-tile flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-5 ${
        dose ? "desktop-dose-tile" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="desktop-vital-title text-sm font-medium text-white/70">
          <span className="lg:hidden">{label}</span>
          <span className="hidden lg:inline">{desktopLabel}</span>
        </div>
        {badge && (
          <span
            className="rounded-full px-3 py-1 text-sm font-semibold text-white"
            style={{ background: tone }}
          >
            {badge}
          </span>
        )}
      </div>
      <div
        className="desktop-vital-value font-mono font-bold tabular-nums text-ink"
        style={{ fontSize: "var(--fs-vital)", lineHeight: "var(--lh-display)" }}
      >
        {big}
        <span className="ml-1 text-base font-normal text-white/55">{unit}</span>
      </div>
      <div className="desktop-vital-chart">{children}</div>
      <div className="desktop-vital-caption text-sm text-white/65">
        <span className="lg:hidden">{sub}</span>
        <span className="hidden lg:inline">{desktopSub}</span>
      </div>
    </div>
  );
}
