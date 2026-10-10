"use client";

import { Button } from "./ui/Button";

interface TopBarProps {
  clock: string;
  running: boolean;
  speed: 1 | 2 | 4;
  onToggle: () => void;
  onSpeed: (s: 1 | 2 | 4) => void;
}

export function TopBar({ clock, running, speed, onToggle, onSpeed }: TopBarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5">
      <div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Crew Health Monitor
          </h1>
        </div>
        <p className="mt-1 text-sm text-white/50">
          Simulated telemetry. Rules decide. The LLM writes prose.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm tabular-nums text-white/70">
          {clock}
        </span>
        <Button variant={running ? "active" : "default"} onClick={onToggle}>
          {running ? "Pause" : "Play"}
        </Button>
        <div className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 p-0.5 text-sm">
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => onSpeed(s as 1 | 2 | 4)}
              className={`rounded px-2 py-1 transition-colors ${
                speed === s
                  ? "bg-ink text-bg"
                  : "text-white/60 hover:text-ink"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
