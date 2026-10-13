"use client";

import { useMemo } from "react";

interface BarChartProps {
  /** Series of values. For the sleep tile, this is the per-night hours. */
  data: number[];
  /** Render height in px. */
  height?: number;
  /** Healthy baseline shown as a dashed horizontal line. */
  baseline?: number;
  /** Watch threshold. Values below this are rendered amber. */
  watch?: number;
  /** Alert threshold. Values below this are rendered red. */
  alert?: number;
  /** Y axis domain [min, max]. Defaults to [0, 12] for sleep. */
  domain?: [number, number];
  /** Override line color. Defaults to traffic-light based on the latest
   *  value vs. baseline. */
  color?: string;
  /** Aria label for the chart. */
  ariaLabel?: string;
}

/**
 * Smooth inline-SVG line chart. Used for the 7-night sleep view and
 * any other small series. No axes, no labels — just a clean trend
 * line with subtle per-point dots, a dashed baseline reference, and
 * per-point colors driven by the watch/alert thresholds.
 */
export function BarChart({
  data,
  height = 80,
  baseline,
  watch,
  alert,
  domain = [0, 12],
  color,
  ariaLabel = "trend",
}: BarChartProps) {
  const [dMin, dMax] = domain;
  const w = 200;
  const points = data.slice(-7);
  const padded = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < 7; i += 1) {
      const v = points[points.length - 7 + i];
      out.push(typeof v === "number" && Number.isFinite(v) ? v : (baseline ?? 7.2));
    }
    return out;
  }, [points, baseline]);

  const range = dMax - dMin || 1;
  const step = w / (padded.length - 1 || 1);
  // Helpers used below. Declared before the path so the const arrow
  // function isn't accessed before initialization.
  const innerH = height - 4;
  function norm(v: number) {
    return ((v - dMin) / range) * (height - 12);
  }
  const path = padded
    .map((v, i) => {
      const x = i * step;
      const y = innerH - norm(v) - 2;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const colorFor = (v: number) => {
    if (color) return color;
    if (alert !== undefined && v < alert) return "#fb7185";
    if (watch !== undefined && v < watch) return "#fbbf24";
    return "rgba(34,197,94,0.95)";
  };

  // For 1-point data, the line path collapses; render a single dot.
  const single = padded.length === 1;

  const baselineY = baseline !== undefined
    ? innerH - norm(baseline)
    : null;

  return (
    <div
      style={{ width: "100%", height }}
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${w} ${height}`}
        preserveAspectRatio="none"
      >
        {baselineY !== null && (
          <line
            x1="0"
            y1={baselineY}
            x2={w}
            y2={baselineY}
            stroke="rgba(255,255,255,0.35)"
            strokeDasharray="2 3"
            strokeWidth={0.6}
          />
        )}
        {!single && (
          <path
            d={path}
            fill="none"
            stroke="rgba(34,197,94,0.45)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {padded.map((v, i) => {
          const x = i * step;
          const y = innerH - norm(v);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={2.4}
              fill={colorFor(v)}
              stroke="rgba(7,13,23,0.6)"
              strokeWidth={0.6}
            />
          );
        })}
      </svg>
    </div>
  );
}
