"use client";

import { Panel, PanelTitle } from "./ui/Panel";
import { LEVEL_NAMES } from "@/lib/types";
import type { Alert, Crew } from "@/lib/types";

export function TraceCard({
  alert,
  crew,
}: {
  alert: Alert | null;
  crew: Crew[];
}) {
  const a = alert;
  return (
    <Panel>
      <PanelTitle title="Why did this alert fire?" />
      {!a ? (
        <p className="text-sm text-white/65">
          Select an alert to see how it was decided.
        </p>
      ) : (
        <div className="space-y-3">
          <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
            <dt className="text-white/60">Rule</dt>
            <dd className="text-ink">{a.n}</dd>
            <dt className="text-white/60">Observed</dt>
            <dd className="text-ink">{a.why}</dd>
            <dt className="text-white/60">Threshold</dt>
            <dd className="text-ink">{a.th}</dd>
            <dt className="text-white/60">Decision</dt>
            <dd className="font-semibold text-ink">
              {LEVEL_NAMES[a.lv]} · produced by the deterministic rule engine
            </dd>
            <dt className="text-white/60">At firing</dt>
            <dd className="font-mono tabular-nums text-ink">{a.t}</dd>
            <dt className="text-white/60">Current state</dt>
            <dd className="text-ink">
              {(crew[a.i]?.r[a.j] ?? 0) >= a.lv ? "Active" : "Cleared"}
            </dd>
            <dt className="text-white/60">AI score</dt>
            <dd className="text-ink">
              {a.aiOn ? `${a.ai} / 100 · advisory only` : "Scorer offline"}
            </dd>
          </dl>
          <p className="rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-2.5 text-sm text-cyan-100/85">
            This is a simulation, not a medical device or clinical
            recommendation. Follow approved mission protocols in real
            operations.
          </p>
        </div>
      )}
    </Panel>
  );
}
