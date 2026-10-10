"use client";

import { cn } from "@/lib/cn";

interface ProgressBarProps {
  /** 0..100 percent. Values outside the range are clamped unless clamp=false. */
  value: number;
  color: string;
  marks?: number[]; // tick positions in percent
  height?: number;
  clamp?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  color,
  marks = [],
  height = 8,
  clamp = true,
  className,
}: ProgressBarProps) {
  const v = clamp ? Math.max(0, Math.min(100, value)) : value;
  const overflow = clamp ? Math.max(0, value - 100) : 0;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full bg-white/10",
        className
      )}
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
          className="absolute top-0 h-full w-[2px] bg-white/60"
          style={{ left: `${Math.max(0, Math.min(100, m))}%` }}
        />
      ))}
    </div>
  );
}
