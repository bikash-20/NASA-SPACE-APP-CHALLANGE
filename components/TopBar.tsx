"use client";

import { Button } from "./ui/Button";
import { cn } from "@/lib/cn";

interface TopBarProps {
  clock: string;
  running: boolean;
  speed: 1 | 2 | 4;
  onToggle: () => void;
  onSpeed: (s: 1 | 2 | 4) => void;
  onDemo: () => void;
  onReset: () => void;
  onOpenScenarios?: () => void;
  onToggleAI?: () => void;
  aiOn?: boolean;
  /** Mobile only — shows the compact title row with the open-scenarios button. */
  compact?: boolean;
}

export function TopBar({
  clock,
  running,
  speed,
  onToggle,
  onSpeed,
  onDemo,
  onReset,
  onOpenScenarios,
  onToggleAI,
  aiOn,
  compact,
}: TopBarProps) {
  return (
    <header
      className={cn(
        "z-20 flex flex-wrap items-center justify-between gap-2 border-b border-white/5 bg-bg-deep/70 px-3 py-2 backdrop-blur-md sm:gap-3 sm:px-5",
        compact ? "sticky top-0" : ""
      )}
    >
      {/* Left: title + clock */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-accent" />
          <h1 className="truncate text-lg font-semibold tracking-tight text-ink sm:text-xl">
            Crew Health Monitor
          </h1>
        </div>
        <span className="hidden font-mono text-sm tabular-nums text-white/60 sm:inline">
          {clock}
        </span>
      </div>

      {/* Center/right: scenarios + controls (desktop), or just play/pause (mobile) */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Scenarios — hidden on mobile (replaced by the scenarios sheet) */}
        <div className="hidden items-center gap-1.5 lg:flex">
          <Button variant="primary" size="sm" onClick={onDemo}>
            Run guided demo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-white/60"
          >
            Reset
          </Button>
          {onToggleAI && (
            <Button
              variant={aiOn ? "ghost" : "danger"}
              size="sm"
              onClick={onToggleAI}
            >
              {aiOn ? "AI on" : "AI offline"}
            </Button>
          )}
        </div>

        <span className="hidden font-mono text-sm tabular-nums text-white/60 lg:hidden sm:inline">
          {clock}
        </span>

        <div className="flex items-center gap-1.5">
          {onOpenScenarios && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenScenarios}
              className="lg:hidden"
              aria-label="Open scenarios"
            >
              <span aria-hidden>☰</span> Scenarios
            </Button>
          )}
          <Button
            variant={running ? "active" : "default"}
            size="sm"
            onClick={onToggle}
            aria-label={running ? "Pause simulation" : "Play simulation"}
          >
            {running ? "Pause" : "Play"}
          </Button>
          <div
            className="flex items-center gap-0.5 rounded-md border border-white/10 bg-white/5 p-0.5"
            role="group"
            aria-label="Simulation speed"
          >
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => onSpeed(s as 1 | 2 | 4)}
                aria-pressed={speed === s}
                className={cn(
                  "tappable rounded px-2 text-sm font-medium tabular-nums",
                  speed === s
                    ? "bg-ink text-bg"
                    : "text-white/65 hover:text-ink"
                )}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
