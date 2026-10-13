"use client";

interface SleepDebtBarProps {
  /** One entry per night. Older samples at index 0, newest at the end.
   *  Missing nights are padded with the healthy baseline (7.2 h). */
  data: number[];
  height?: number;
  /** Healthy baseline shown as a dotted reference line. */
  baseline?: number;
  /** Watch threshold (< this is amber). */
  watch?: number;
  /** Alert threshold (< this is red). */
  alert?: number;
}

/**
 * 7-bar sleep chart. One bar per night, height = hours (clamped to
 * 0..12), color by rule threshold. Renders inline as plain SVG so the
 * chart never depends on a parent container query — it scales with the
 * surrounding card.
 */
export function SleepDebtBar({
  data,
  height = 64,
  baseline = 7.2,
  watch = 5.5,
  alert = 4.5,
}: SleepDebtBarProps) {
  // Pad to 7 columns.
  const padded: number[] = [];
  for (let i = 0; i < 7; i += 1) {
    const v = data[data.length - 7 + i];
    padded.push(typeof v === "number" && Number.isFinite(v) ? v : baseline);
  }
  const yMax = 12;
  const w = 100 / padded.length;
  const bars = padded.map((hours, i) => {
    const clamped = Math.max(0, Math.min(yMax, hours));
    const h = (clamped / yMax) * height;
    const y = height - h;
    const color =
      hours < alert
        ? "#fb7185"
        : hours < watch
          ? "#fbbf24"
          : "rgba(34,197,94,0.55)";
    return (
      <g key={i}>
        <rect
          x={i * w + w * 0.18}
          y={y}
          width={w * 0.64}
          height={Math.max(2, h)}
          rx={2}
          fill={color}
        />
      </g>
    );
  });
  const baselineY = height - (Math.min(yMax, baseline) / yMax) * height;
  return (
    <div
      style={{ width: "100%", height }}
      role="img"
      aria-label={`7-night sleep history, newest on the right`}
    >
      <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
        <line
          x1="0"
          y1={baselineY}
          x2="100"
          y2={baselineY}
          stroke="rgba(255,255,255,0.35)"
          strokeDasharray="1 2"
          strokeWidth={0.5}
        />
        {bars}
      </svg>
    </div>
  );
}
