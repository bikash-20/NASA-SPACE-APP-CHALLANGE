"use client";

import { useMemo } from "react";
import type { Crew } from "@/lib/types";

interface Timeline24hChartProps {
  crew: Crew;
  className?: string;
}

export function Timeline24hChart({ crew, className = "" }: Timeline24hChartProps) {
  const data = useMemo(() => {
    const points = [];
    const baseHr = crew.bhr;
    const currentHr = crew.hr;
    const hours = 24;

    for (let h = 0; h <= hours; h += 0.5) {
      const circadian = Math.sin(((h - 8) / 12) * Math.PI) * 12;
      const noise = Math.sin(h * 3.7) * 3;
      const hr = Math.round(baseHr + 10 + circadian + noise + (h > 20 ? (currentHr - baseHr) * 0.4 : 0));
      
      let glucose = 88 + Math.cos(h * 0.8) * 4;
      if (h >= 7 && h <= 9.5) glucose += Math.sin(((h - 7) / 2.5) * Math.PI) * 38;
      if (h >= 12.5 && h <= 15) glucose += Math.sin(((h - 12.5) / 2.5) * Math.PI) * 42;
      if (h >= 18.5 && h <= 21) glucose += Math.sin(((h - 18.5) / 2.5) * Math.PI) * 35;

      points.push({
        time: `${String(Math.floor(h)).padStart(2, "0")}:${h % 1 === 0 ? "00" : "30"}`,
        hr,
        glucose: Math.round(glucose),
      });
    }
    return points;
  }, [crew.bhr, crew.hr]);

  const width = 800;
  const height = 200;
  const paddingX = 45;
  const paddingY = 28;
  const innerW = width - paddingX * 2;
  const innerH = height - paddingY * 2;

  const hrPoints = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * innerW;
    const y = height - paddingY - ((d.hr - 45) / (150 - 45)) * innerH;
    return `${x},${y}`;
  });

  const gluPoints = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * innerW;
    const y = height - paddingY - ((d.glucose - 60) / (170 - 60)) * innerH;
    return `${x},${y}`;
  });

  const hrPath = `M ${hrPoints.join(" L ")}`;
  const gluPath = `M ${gluPoints.join(" L ")}`;

  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl font-sans ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            24H Telemetry Timeline · Heart Rate &amp; Glucose
          </h3>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono font-semibold">
          <div className="flex items-center gap-2 text-rose-400">
            <span className="inline-block h-2 w-4 rounded-full bg-rose-500" />
            <span>Heart Rate (BPM)</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-300">
            <span className="inline-block h-2 w-4 rounded-full bg-cyan-400" />
            <span>Glucose (mg/dL)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-300">
            <span>🍽️</span>
            <span>Meal Events</span>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#020617] p-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Horizontal grid lines */}
          {[0.25, 0.5, 0.75].map((r) => (
            <line
              key={r}
              x1={paddingX}
              y1={paddingY + innerH * r}
              x2={width - paddingX}
              y2={paddingY + innerH * r}
              stroke="rgba(51, 65, 85, 0.35)"
              strokeDasharray="4 4"
            />
          ))}

          {/* Meal Marker Vertical Pins */}
          {[{ x: paddingX + innerW * (7.5 / 24), label: "Breakfast" },
            { x: paddingX + innerW * (13 / 24), label: "Lunch" },
            { x: paddingX + innerW * (19 / 24), label: "Dinner" }].map((pin, i) => (
            <g key={i}>
              <line
                x1={pin.x}
                y1={paddingY}
                x2={pin.x}
                y2={height - paddingY}
                stroke="rgba(245, 158, 11, 0.6)"
                strokeDasharray="3 3"
              />
              <circle cx={pin.x} cy={paddingY + 6} r={5} fill="#f59e0b" />
              <text
                x={pin.x}
                y={paddingY - 8}
                fill="#fde047"
                fontSize="11"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                {pin.label}
              </text>
            </g>
          ))}

          {/* Glucose Path */}
          <path
            d={gluPath}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Heart Rate Path */}
          <path
            d={hrPath}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* X-Axis labels */}
          {["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"].map((t, idx) => {
            const xPos = paddingX + (idx / 6) * innerW;
            return (
              <text
                key={t}
                x={xPos}
                y={height - 8}
                fill="#94a3b8"
                fontSize="11"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                {t}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
