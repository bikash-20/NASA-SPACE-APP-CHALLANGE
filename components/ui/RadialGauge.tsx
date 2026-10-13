"use client";

import { motion } from "framer-motion";

interface RadialGaugeProps {
  /** Current reading (e.g. mSv of cumulative dose). */
  value: number;
  /** Maximum / 100% of the dial. */
  max: number;
  /** Watch threshold (e.g. 200 mSv = 80% of limit). Drawn as an inner tick. */
  watch?: number;
  /** Alert threshold (e.g. 237.5 mSv = 95% of limit). Drawn as an outer tick. */
  alert?: number;
  /** Override color. Defaults to traffic-light based on band. */
  color?: string;
  /** When true, the gauge glows + pulses. */
  danger?: boolean;
  /** Diameter in px. */
  size?: number;
  /** Stroke width in px. */
  strokeWidth?: number;
}

/**
 * SVG circular dial. Used for the radiation dose. The dial fills from
 * 12 o'clock clockwise. `watch` and `alert` thresholds render as small
 * ticks inside the dial. When `danger` is true, the stroke glows and
 * the gauge uses the existing `pulseRing` keyframe.
 */
export function RadialGauge({
  value,
  max,
  watch,
  alert,
  color,
  danger = false,
  size = 56,
  strokeWidth = 6,
}: RadialGaugeProps) {
  const pct = Math.max(0, Math.min(1, value / max));
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  // 12 o'clock = -90deg, sweep clockwise.
  const startAngle = -90;
  const endAngle = startAngle + pct * 360;

  const arcPath = describeArc(cx, cy, radius, startAngle, endAngle);
  const trackPath = describeArc(cx, cy, radius, startAngle, startAngle + 360);

  const stroke =
    color ??
    (pct >= 0.95
      ? "#fb7185"
      : pct >= 0.8
        ? "#fbbf24"
        : "#22c55e");

  return (
    <div
      className={danger ? "animate-pulseRing" : undefined}
      style={{
        width: size,
        height: size,
        position: "relative",
        filter: danger ? `drop-shadow(0 0 6px ${stroke})` : undefined,
      }}
      role="img"
      aria-label={`Dose gauge: ${Math.round(pct * 100)}% of limit`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <path
          d={trackPath}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {pct > 0 && (
          <motion.path
            d={arcPath}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={false}
            animate={{ d: arcPath }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
        {watch !== undefined &&
          renderTick(cx, cy, radius, watch / max, "#fbbf24", strokeWidth)}
        {alert !== undefined &&
          renderTick(cx, cy, radius, alert / max, "#fb7185", strokeWidth)}
      </svg>
    </div>
  );
}

function polar(angleDeg: number, radius: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(a) * radius, y: Math.sin(a) * radius };
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polar(startAngle, radius);
  const end = polar(endAngle, radius);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx + start.x} ${cy + start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${cx + end.x} ${cy + end.y}`;
}

function renderTick(
  cx: number,
  cy: number,
  radius: number,
  pct: number,
  color: string,
  strokeWidth: number
) {
  if (pct <= 0 || pct >= 1) return null;
  const angle = -90 + pct * 360;
  const tickLen = strokeWidth * 0.8;
  const inner = polar(angle, radius - strokeWidth / 2 - 1);
  const outer = polar(angle, radius - strokeWidth / 2 - 1 - tickLen);
  return (
    <line
      x1={cx + inner.x}
      y1={cy + inner.y}
      x2={cx + outer.x}
      y2={cy + outer.y}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  );
}
