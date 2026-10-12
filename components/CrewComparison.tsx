"use client";

import { Panel, PanelTitle } from "./ui/Panel";
import { colorForLevel } from "@/lib/colors";
import { LEVEL_NAMES, type Crew, type Level } from "@/lib/types";

interface CrewComparisonProps {
  crew: Crew[];
  selected: 0 | 1 | 2;
  onSelect: (index: 0 | 1 | 2) => void;
}

export function CrewComparison({
  crew,
  selected,
  onSelect,
}: CrewComparisonProps) {
  return (
    <Panel density="compact">
      <PanelTitle title="Crew comparison" hint="synthetic telemetry" />
      <p className="mb-2 text-sm text-white/65">
        Compare current readings across the crew. Rule status is computed independently per person.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {crew.map((member, index) => {
          const level = member.r.reduce<number>(
            (worst, current) => Math.max(worst, current),
            0
          ) as Level;
          const isSelected = index === selected;
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelect(index as 0 | 1 | 2)}
              aria-pressed={isSelected}
              className={`tappable min-w-0 rounded-lg border p-2.5 text-left transition-colors ${
                isSelected
                  ? "border-accent/60 bg-accent/10"
                  : "border-white/10 bg-white/[0.025] hover:bg-white/[0.06]"
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-ink">
                  {member.n}
                </span>
                <span
                  className="shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold"
                  style={{
                    color: colorForLevel(level),
                    borderColor: colorForLevel(level),
                  }}
                >
                  {LEVEL_NAMES[level]}
                </span>
              </span>
              <span className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-xs tabular-nums text-white/75">
                <span>HR {Math.round(member.hr)} bpm</span>
                <span>SpO₂ {member.spo2.toFixed(1)}%</span>
                <span>Sleep {member.sleep.toFixed(1)} h</span>
                <span>Dose {Math.round(member.dose)} mSv</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-white/55">
        Demonstration only — not a medical device or source of clinical guidance.
      </p>
    </Panel>
  );
}
