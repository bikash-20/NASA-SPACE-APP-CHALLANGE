"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface DoseAreaChartProps {
  /** Cumulative dose history, one sample per tick (mSv). */
  data: number[];
  /** Hard limit (e.g. 250 mSv). */
  limit: number;
  /** Watch threshold (e.g. 200 mSv = 80%). */
  watch?: number;
  /** Alert threshold (e.g. 237.5 mSv = 95%). */
  alert?: number;
  height?: number;
}

/**
 * Cumulative radiation dose area chart. The grey band up to `watch` is
 * "safe"; the amber band is "watch"; the red band is "alert". The line
 * is colored by where the latest sample sits.
 */
export function DoseAreaChart({
  data,
  limit,
  watch = 0.8 * limit,
  alert = 0.95 * limit,
  height = 64,
}: DoseAreaChartProps) {
  if (data.length < 2) {
    return <div style={{ height, width: "100%" }} />;
  }
  const points = data.map((v, i) => ({ i, v }));
  const latest = data[data.length - 1] ?? 0;
  const stroke =
    latest >= alert
      ? "#fb7185"
      : latest >= watch
        ? "#fbbf24"
        : "#22c55e";
  const fill = stroke + "33"; // 20% alpha
  return (
    <div style={{ height, width: "100%" }}>
      <ResponsiveContainer>
        <AreaChart
          data={points}
          margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
        >
          <defs>
            <linearGradient id="doseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.45} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis dataKey="i" hide />
          <YAxis
            hide
            domain={[0, Math.max(limit, latest + 10)]}
          />
          <ReferenceArea
            y1={0}
            y2={watch}
            fill="rgba(34,197,94,0.06)"
          />
          <ReferenceArea
            y1={watch}
            y2={alert}
            fill="rgba(251,191,36,0.10)"
          />
          <ReferenceArea
            y1={alert}
            y2={limit + 20}
            fill="rgba(251,113,133,0.10)"
          />
          <ReferenceLine
            y={watch}
            stroke="#fbbf24"
            strokeDasharray="2 3"
            strokeWidth={1}
          />
          <ReferenceLine
            y={alert}
            stroke="#fb7185"
            strokeDasharray="2 3"
            strokeWidth={1}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(11,18,32,0.95)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 8,
              fontSize: 12,
              color: "#e2e8f0",
            }}
            labelFormatter={(v: number) => `tick ${v}`}
            formatter={(v: number) => [`${Math.round(v)} mSv`, "Dose"]}
            cursor={{ stroke: "rgba(255,255,255,0.20)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="v"
            stroke={stroke}
            strokeWidth={2}
            fill="url(#doseFill)"
            isAnimationActive
            animationDuration={300}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
