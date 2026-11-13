"use client";

import { Button } from "./ui/Button";
import { cn } from "@/lib/cn";

interface TopBarProps {
  clock: string;
  running: boolean;
  speed: 1 | 2 | 4;
  onToggle: () => void;
  onStep: () => void;
  onSpeed: (s: 1 | 2 | 4) => void;
  onDemo: () => void;
  onReset: () => void;
  onOpenScenarios?: () => void;
  onOpenSettings?: () => void;
  onSignOut?: () => void;
  aiOn?: boolean;
  /** Mobile only — shows the compact title row with the open-scenarios button. */
  compact?: boolean;
  /**
   * Hide the inline "Run guided demo" / "Reset" buttons in the top bar.
   * Used at lg+ where the dedicated scenario card in the right rail takes
   * over. The Play / Pause / Speed controls always stay.
   */
  hideScenarios?: boolean;
}

export function TopBar({
  clock,
  running,
  speed,
  onToggle,
  onStep,
  onSpeed,
  onDemo,
  onReset,
  onOpenScenarios,
  onOpenSettings,
  onSignOut,
  compact,
  hideScenarios,
}: TopBarProps) {
  return (
    <header
      className={cn(
        "z-20 flex flex-wrap items-center justify-between gap-2 border-b border-white/5 bg-bg-deep/70 px-3 py-2 backdrop-blur-md sm:gap-3 sm:px-5",
        "dashboard-topbar",
        compact ? "sticky top-0" : ""
      )}
    >
      {/* Left: title */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-300" aria-hidden />
            <h1 className="truncate text-lg font-semibold tracking-tight text-ink sm:text-xl">
              Crew Health Monitor
            </h1>
            <span className="shrink-0 rounded border border-cyan-300/30 bg-cyan-300/10 px-1.5 py-0.5 text-[0.625rem] font-bold tracking-[0.12em] text-cyan-200">
              SIM
            </span>
          </div>
          <p className="hidden pl-4 text-xs text-white/55 sm:block">
            Rule-based decision support · synthetic telemetry
          </p>
          <p className="hidden pl-4 text-sm text-white/65 lg:block">
            Synthetic telemetry · deterministic rules decide · AI only advises
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* The demo and reset controls stay in the header on desktop. */}
        {!hideScenarios && (
          <div className="hidden items-center gap-1.5 sm:flex">
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
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {onOpenSettings && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenSettings}
              aria-label="Open settings"
              title="Preferences and local AI settings"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-4 w-4"
              >
                <path
                  d="M8.2 2.8h3.6l.5 2a5.6 5.6 0 0 1 1.4.8l1.9-.7 1.8 3.1-1.5 1.3a5 5 0 0 1 0 1.6l1.5 1.3-1.8 3.1-1.9-.7a5.6 5.6 0 0 1-1.4.8l-.5 2H8.2l-.5-2a5.6 5.6 0 0 1-1.4-.8l-1.9.7-1.8-3.1 1.5-1.3a5 5 0 0 1 0-1.6L2.6 8l1.8-3.1 1.9.7a5.6 5.6 0 0 1 1.4-.8l.5-2Z"
                  strokeLinejoin="round"
                />
                <circle cx="10" cy="10" r="2.4" />
              </svg>
              <span className="hidden sm:inline">Settings</span>
            </Button>
          )}
          {onOpenScenarios && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenScenarios}
              className="lg:hidden"
              aria-label="Open scenarios"
            >
              Inject a problem
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
          <Button
            variant="ghost"
            size="sm"
            onClick={onStep}
            disabled={running}
            aria-label="Advance simulation by one 30-minute tick"
            title={running ? "Pause the simulation to step" : "Advance by 30 minutes"}
          >
            Step +30m
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
          {/* Single clock, next to Pause / Speed. Hidden on mobile where
              vertical space is tight. */}
          <span className="hidden font-mono text-sm tabular-nums text-white/60 sm:inline">
            {clock}
          </span>
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-md border border-rose-500/40 bg-rose-950/40 px-2.5 py-1 font-mono text-xs font-semibold text-rose-300 hover:bg-rose-900/60 hover:text-white transition"
              title="Sign Out to Login Gateway"
            >
              Sign Out [→
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
