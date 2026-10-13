"use client";

import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface RadarChartProps {
  /** One row per axis. `axis` is the label, `value` is 0..1 of max. */
  data: { axis: string; value: number }[];
  /** Stroke + fill color for the polygon. */
  color: string;
  height?: number;
  /** When true, render a greyed-out placeholder and dim the labels. */
  offline?: boolean;
}

/**
 * Spider / radar chart for the AI risk score. Renders 5 axes
 * (Heart rate, Oxygen, Sleep, Stress, Radiation) and a single filled
 * polygon whose radius per axis is the factor's normalized contribution.
 *
 * The component is purely a visual aid. The AI risk score is advisory
 * only; the rule engine is the source of truth for alerts. The caller
 * is responsible for the "advises only" copy in the surrounding card.
 */
export function RadarChart({
  data,
  color,
  height = 180,
  offline = false,
}: RadarChartProps) {
  const fill = offline ? "rgba(255,255,255,0.05)" : hexToRgba(color, 0.28);
  const stroke = offline ? "rgba(255,255,255,0.20)" : color;
  return (
    <div
      style={{ height, width: "100%" }}
      aria-label="AI risk factors radar"
      role="img"
    >
      <ResponsiveContainer>
        <RechartsRadar data={data} outerRadius="75%">
          <PolarGrid stroke="rgba(255,255,255,0.12)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{
              fill: offline ? "rgba(255,255,255,0.35)" : "rgba(226,232,240,0.75)",
              fontSize: 11,
            }}
          />
          <PolarRadiusAxis
            domain={[0, 1]}
            tick={false}
            axisLine={false}
          />
          <Radar
            dataKey="value"
            stroke={stroke}
            fill={fill}
            fillOpacity={1}
            strokeWidth={2}
            isAnimationActive
            animationDuration={300}
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
