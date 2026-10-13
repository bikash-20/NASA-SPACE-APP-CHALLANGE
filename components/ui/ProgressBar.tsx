"use client";

import { cn } from "@/lib/cn";

interface ProgressBarProps {
  /** 0..100 percent. Values outside the range are clamped unless clamp=false. */
  value: number;
  color: string;
  /** Tick positions in percent (0..100). Drawn as vertical lines across
   *  the bar. Use these for threshold markers like 80% / 95%. */
  marks?: number[];
  height?: number;
  /** Width of each threshold mark in px. Defaults to 2 for thin bars,
   *  3 when height >= 12. */
  tickWidth?: number;
  /** When true, render the tick values as small labels above the bar. */
  showLabels?: boolean;
  clamp?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  color,
  marks = [],
  height = 8,
  tickWidth,
  showLabels = false,
  clamp = true,
  className,
}: ProgressBarProps) {
  const v = clamp ? Math.max(0, Math.min(100, value)) : value;
  const overflow = clamp ? Math.max(0, value - 100) : 0;
  const tickW = tickWidth ?? (height >= 12 ? 3 : 2);
  return (
    <div className={cn("w-full", className)}>
      <div
        className="relative overflow-hidden rounded-full bg-white/10"
        style={{ height }}
        role="progressbar"
        aria-valuenow={Math.round(v)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${v}%`, background: color }}
        />
        {overflow > 0 && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `repeating-linear-gradient(45deg, ${color} 0 6px, transparent 6px 12px)`,
              opacity: 0.35,
            }}
          />
        )}
        {marks.map((m, i) => (
          <div
            key={i}
            className="absolute top-0 h-full bg-white/70"
            style={{
              left: `${Math.max(0, Math.min(100, m))}%`,
              width: tickW,
              transform: "translateX(-50%)",
            }}
          />
        ))}
      </div>
      {showLabels && marks.length > 0 && (
        <div className="relative mt-1 h-3 font-mono text-[10px] tabular-nums text-white/55">
          {marks.map((m, i) => (
            <span
              key={i}
              className="absolute -translate-x-1/2 whitespace-nowrap"
              style={{ left: `${Math.max(0, Math.min(100, m))}%` }}
            >
              {m}%
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
