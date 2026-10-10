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
  // Resolve the merged key if the selected key matches a group
  // (we receive an Alert — but the panel key from the new AlertsCard is `${i}-${j}`).
  // Convert it for display.
  const a = alert;
  return (
    <Panel>
      <PanelTitle title="Why did this alert fire?" />
      {!a ? (
        <p className="text-sm text-white/65">
          Select an alert to see how it was decided.
        </p>
      ) : (
        <ol className="ml-5 list-decimal space-y-1.5 text-base text-white/85">
          <li>
            <b className="text-ink">Reading.</b> {a.why}.
          </li>
          <li>
            <b className="text-ink">Rule.</b> {a.n} threshold: {a.th}. Result:{" "}
            {LEVEL_NAMES[a.lv]}.
          </li>
          <li>
            <b className="text-ink">AI score at the time.</b>{" "}
            {a.aiOn
              ? `${a.ai} of 100, advisory only`
              : "scorer was offline, not needed"}
            .
          </li>
          <li>
            <b className="text-ink">Decision.</b> Made by the rule, not the AI.
          </li>
          <li>
            <b className="text-ink">Action.</b>{" "}
            {a.lv === 2
              ? "Page the flight surgeon now and start the protocol."
              : "Notify the flight surgeon and re-check in 30 minutes."}
          </li>
        </ol>
      )}
    </Panel>
  );
}
