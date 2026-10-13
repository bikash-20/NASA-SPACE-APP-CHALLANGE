"use client";

import { Panel, PanelTitle } from "./ui/Panel";
import { Button } from "./ui/Button";
import { LEVEL_NAMES } from "@/lib/types";
import { colorForLevel } from "@/lib/colors";
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

const CREW_LABELS = ["Amara", "Lin", "Rafi"];

export function MissionTimeline({
  events,
  onInspectAlert,
  onReplay,
}: MissionTimelineProps) {
  // The Gantt strip uses only the alert events (kind === "alert") and
  // drops everything else — it's a pure cause-vs-effect view.
  const alertEvents = events.filter(
    (e): e is TimelineEntry & { level: Level; crewIndex: 0 | 1 | 2; alertKey: string } =>
      e.kind === "alert" &&
      e.level !== undefined &&
      e.crewIndex !== undefined &&
      !!e.alertKey
  );
  const scenarioEvents = events.filter((e) => e.kind === "scenario" || e.kind === "demo");

  return (
    <Panel density="compact">
      <PanelTitle title="Mission timeline" hint={`${events.length} recent events`} />
      {events.length === 0 ? (
        <p className="text-sm text-white/65">
          Scenario changes and rule alerts will appear here as the simulation runs.
        </p>
      ) : (
        <>
          {alertEvents.length > 0 && (
            <GanttStrip
              alerts={alertEvents}
              maxTick={Math.max(...alertEvents.map((a) => a.tick), 60)}
              onInspect={onInspectAlert}
            />
          )}
          <ol className="desktop-timeline-list mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
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
        </>
      )}
    </Panel>
  );
}

/**
 * Inline-SVG Gantt strip. Three rows (one per crew), each alert is a
 * thin pill positioned at the alert's tick. Hovering shows the alert
 * reason; clicking inspects the alert in the parent panel.
 */
function GanttStrip({
  alerts,
  maxTick,
  onInspect,
}: {
  alerts: Array<TimelineEntry & { level: Level; crewIndex: 0 | 1 | 2; alertKey: string }>;
  maxTick: number;
  onInspect: (key: string) => void;
}) {
  const ROW_H = 18;
  const LABEL_W = 50;
  const TOTAL_H = ROW_H * 3 + 4;
  const W = 100;
  const innerW = W - LABEL_W;
  const ticks = [0, Math.round(maxTick / 2), maxTick];
  return (
    <div className="desktop-timeline-gantt" aria-label="Alert Gantt strip">
      <div className="mb-1 flex items-center justify-between text-[0.6875rem] text-white/55">
        <span className="font-semibold uppercase tracking-wider text-accent">
          Gantt · alert correlation
        </span>
        <span className="font-mono tabular-nums">0 → tick {maxTick}</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${TOTAL_H}`}
        width="100%"
        height={TOTAL_H}
        preserveAspectRatio="none"
        style={{ overflow: "visible" }}
      >
        {alerts.map((a, idx) => {
          const row = a.crewIndex;
          const y = row * ROW_H + 1;
          const x = LABEL_W + (a.tick / Math.max(1, maxTick)) * innerW;
          // Pill width by level: Alert=2.4, Watch=1.6
          const w = a.level === 2 ? 2.4 : 1.6;
          const color = colorForLevel(a.level);
          return (
            <rect
              key={`${a.id}-${idx}`}
              x={x - w / 2}
              y={y}
              width={w}
              height={ROW_H - 4}
              rx={0.6}
              fill={color}
              opacity={0.85}
              onClick={() => onInspect(a.alertKey)}
              style={{ cursor: "pointer" }}
            >
              <title>
                {`${CREW_LABELS[row] ?? row} · ${a.title} (tick ${a.tick})`}
              </title>
            </rect>
          );
        })}
        {ticks.map((t, i) => {
          const x = LABEL_W + (t / Math.max(1, maxTick)) * innerW;
          return (
            <g key={`tk-${i}`}>
              <line
                x1={x}
                y1={0}
                x2={x}
                y2={TOTAL_H}
                stroke="rgba(255,255,255,0.10)"
                strokeWidth={0.2}
              />
              <text
                x={x}
                y={TOTAL_H + 0}
                fontSize={2.6}
                fill="rgba(255,255,255,0.45)"
                textAnchor={i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle"}
              >
                t{t}
              </text>
            </g>
          );
        })}
        {CREW_LABELS.map((label, i) => (
          <text
            key={`lbl-${i}`}
            x={LABEL_W - 2}
            y={i * ROW_H + ROW_H / 2 + 1.2}
            fontSize={2.8}
            fill="rgba(226,232,240,0.75)"
            textAnchor="end"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}
