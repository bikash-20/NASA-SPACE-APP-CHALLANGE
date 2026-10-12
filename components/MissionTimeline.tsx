"use client";

import { Panel, PanelTitle } from "./ui/Panel";
import { Button } from "./ui/Button";
import { LEVEL_NAMES } from "@/lib/types";
import type { Level } from "@/lib/types";

export interface TimelineEntry {
  id: string;
  tick: number;
  at: string;
  kind: "alert" | "scenario" | "demo";
  title: string;
  detail: string;
  crewIndex?: 0 | 1 | 2;
  alertKey?: string;
  level?: Level;
  scenario?: "cardiac" | "sleep" | "storm" | "guided-demo";
}

interface MissionTimelineProps {
  events: TimelineEntry[];
  onInspectAlert: (key: string) => void;
  onReplay: (scenario: NonNullable<TimelineEntry["scenario"]>, crewIndex?: 0 | 1 | 2) => void;
}

export function MissionTimeline({
  events,
  onInspectAlert,
  onReplay,
}: MissionTimelineProps) {
  return (
    <Panel density="compact">
      <PanelTitle title="Mission timeline" hint={`${events.length} recent events`} />
      {events.length === 0 ? (
        <p className="text-sm text-white/65">
          Scenario changes and rule alerts will appear here as the simulation runs.
        </p>
      ) : (
        <ol className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {events.slice(0, 8).map((event) => (
            <li
              key={event.id}
              className="rounded-lg border border-white/10 bg-white/[0.025] p-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {event.level !== undefined && (
                      <span className="mr-1.5 text-white/65">
                        {LEVEL_NAMES[event.level]}:
                      </span>
                    )}
                    {event.title}
                  </p>
                  <p className="mt-0.5 text-sm text-white/65">{event.detail}</p>
                  <p className="mt-1 font-mono text-xs tabular-nums text-white/55">
                    {event.at} · tick {event.tick}
                  </p>
                </div>
                {event.alertKey ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onInspectAlert(event.alertKey ?? "")}
                  >
                    Inspect
                  </Button>
                ) : event.scenario ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (event.scenario) {
                        onReplay(event.scenario, event.crewIndex);
                      }
                    }}
                  >
                    Replay
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
