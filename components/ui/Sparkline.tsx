"use client";

import {
  LineChart,
  Line,
  YAxis,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";

interface SparklineProps {
  data: number[];
  threshold?: number;
  color: string;
  yMin?: number;
  yMax?: number;
  height?: number;
  strokeWidth?: number;
  /** Optional "normal range" shaded behind the line. */
  normalBand?: [number, number];
  /** Marker colors are picked from this level when set. */
  levelColor?: "ok" | "watch" | "bad";
  /** When true, renders a minimal ECG-style strip (no normal band).
   *  Used in the crew rail cards. */
  compact?: boolean;
}

const LEVEL_STROKE: Record<"ok" | "watch" | "bad", string> = {
  ok: "#22c55e",
  watch: "#fbbf24",
  bad: "#fb7185",
};

/**
 * Tiny chart with no axes, animated, threshold dashed, optional normal
 * range band. Used inside vitals tiles and the crew rail cards.
 */
export function Sparkline({
  data,
  threshold,
  color,
  yMin,
  yMax,
  height = 64,
  strokeWidth = 3,
  normalBand,
  levelColor,
  compact = false,
}: SparklineProps) {
  const points = data.map((v, i) => ({ i, v }));
  if (points.length < 2) {
    return <div style={{ height }} />;
  }
  const stroke = levelColor ? LEVEL_STROKE[levelColor] : color;
  return (
    <div style={{ height, width: "100%" }}>
      <ResponsiveContainer>
        <LineChart
          data={points}
          margin={{ top: 6, right: 4, bottom: 6, left: 4 }}
        >
          <YAxis hide domain={[yMin ?? "auto", yMax ?? "auto"]} />
          {!compact && normalBand && (
            <ReferenceArea
              y1={normalBand[0]}
              y2={normalBand[1]}
              fill="rgba(255,255,255,0.06)"
              stroke="rgba(255,255,255,0.10)"
              strokeDasharray="2 3"
            />
          )}
          {!compact && threshold !== undefined && (
            <ReferenceLine
              y={threshold}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          )}
          <Line
            type="monotone"
            dataKey="v"
            stroke={stroke}
            strokeWidth={strokeWidth}
            dot={false}
            isAnimationActive
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
