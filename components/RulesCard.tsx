"use client";

import { Panel, PanelTitle } from "./ui/Panel";
import { colorForLevel } from "@/lib/colors";
import { LEVEL_NAMES } from "@/lib/types";
import type { Crew } from "@/lib/types";

export function RulesCard({ crew }: { crew: Crew }) {
  return (
    <Panel tone="ok" density="compact">
      <PanelTitle title="Rules" tone="ok" hint="decide" />
      <ul className="divide-y divide-white/5">
        {crew.R.map((r) => (
          <li
            key={r.n}
            className="grid grid-cols-[1.5rem_1fr_auto] items-start gap-2 py-2 first:pt-0 last:pb-0"
          >
            <span
              className="mt-1.5 inline-block h-3 w-3 shrink-0 rounded-full"
              style={{ background: colorForLevel(r.lv) }}
              aria-label={LEVEL_NAMES[r.lv]}
            />
            <div className="min-w-0">
              <b className="block text-sm font-semibold text-ink">{r.n}</b>
              <span className="block text-sm text-white/65">{r.th}</span>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm tabular-nums text-ink">
                {r.val}
              </div>
              <div
                className="text-sm font-semibold"
                style={{ color: colorForLevel(r.lv) }}
              >
                {LEVEL_NAMES[r.lv]}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
