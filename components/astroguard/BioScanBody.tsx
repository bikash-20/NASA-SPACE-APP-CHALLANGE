"use client";

import { useState } from "react";
import type { Crew } from "@/lib/types";

interface BioScanBodyProps {
  crew: Crew;
  className?: string;
}

export function BioScanBody({ crew, className = "" }: BioScanBodyProps) {
  const [activeNode, setActiveNode] = useState<string>("cardiac");

  // Dynamically compute hemodynamic and respiratory vitals based on crew telemetry
  const sysBp = Math.round(116 + (crew.hr - 65) * 0.42 + crew.stress * 0.22);
  const diaBp = Math.round(74 + (crew.hr - 65) * 0.2 + crew.stress * 0.12);
  const respRate = Math.round(
    14 + (crew.hr - 60) * 0.08 + (crew.spo2 < 96 ? (96 - crew.spo2) * 1.2 : 0)
  );
  const dynGlucose = Math.round(92 + (crew.hr - 65) * 0.35 + crew.stress * 0.22);
  const dynHydration = (
    78.5 -
    (crew.hr > 85 ? (crew.hr - 85) * 0.08 : 0) -
    crew.stress * 0.04
  ).toFixed(1);

  const nodes = [
    {
      id: "neuro",
      name: "Neuro / Cranial Activity",
      cx: 100,
      cy: 42,
      r: 6,
      status: crew.sleep < 5.5 ? "Watch" : crew.stress > 65 ? "Elevated" : "Nominal",
      color: crew.sleep < 5.5 ? "#f59e0b" : crew.stress > 65 ? "#f43f5e" : "#10b981",
      val: `Sleep: ${crew.sleep.toFixed(1)}h · Stress: ${Math.round(crew.stress)}/100`,
    },
    {
      id: "respiratory",
      name: "Pulmonary & SpO₂ Exchange",
      cx: 100,
      cy: 88,
      r: 7,
      status: crew.spo2 < 92 ? "Alert" : crew.spo2 < 95 ? "Watch" : "Optimal",
      color: crew.spo2 < 92 ? "#ef4444" : crew.spo2 < 95 ? "#f59e0b" : "#10b981",
      val: `SpO₂: ${crew.spo2.toFixed(1)}% · Resp: ${respRate} Br/min`,
    },
    {
      id: "cardiac",
      name: "Cardiac & Hemodynamics",
      cx: 108,
      cy: 104,
      r: 8,
      status: crew.hr > 105 ? "Alert" : crew.hr > 85 ? "Watch" : "Optimal",
      color: crew.hr > 105 ? "#ef4444" : crew.hr > 85 ? "#f59e0b" : "#10b981",
      val: `Heart Rate: ${Math.round(crew.hr)} BPM · BP: ${sysBp}/${diaBp}`,
    },
    {
      id: "gut",
      name: "Metabolic / Interstitial Glucose",
      cx: 100,
      cy: 142,
      r: 6,
      status: crew.stress > 55 ? "Watch" : "Nominal",
      color: crew.stress > 55 ? "#f59e0b" : "#06b6d4",
      val: `Glucose: ${dynGlucose} mg/dL · Hydration: ${dynHydration}%`,
    },
    {
      id: "dosimetry",
      name: "Dosimetry & Cellular Radiation",
      cx: 100,
      cy: 175,
      r: 6,
      status: crew.dose > 150 ? "Alert" : crew.rate > 0.5 ? "Watch" : "Nominal",
      color: crew.dose > 150 ? "#ef4444" : crew.rate > 0.5 ? "#f59e0b" : "#8b5cf6",
      val: `30D Dose: ${crew.dose.toFixed(0)} mSv · Rate: ${crew.rate.toFixed(2)} mSv/h`,
    },
    {
      id: "muscle-r",
      name: "Right Limb Actigraphy & Tone",
      cx: 66,
      cy: 130,
      r: 5,
      status: "Nominal",
      color: "#8b5cf6",
      val: "6-Axis IMU Active · Muscle: 98%",
    },
    {
      id: "muscle-l",
      name: "Left Limb Actigraphy & Tone",
      cx: 134,
      cy: 130,
      r: 5,
      status: "Nominal",
      color: "#8b5cf6",
      val: "6-Axis IMU Active · Muscle: 98%",
    },
  ];

  const current = nodes.find((n) => n.id === activeNode) || nodes[2];

  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl font-sans ${className}`}
    >
      <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            Bio-Scan 2D Anatomical Telemetry
          </h3>
        </div>
        <span className="font-mono text-xs font-bold text-cyan-300">
          Scoping: {crew.n}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
        {/* SVG Anatomical Silhouette */}
        <div className="relative flex justify-center py-2">
          <svg
            viewBox="0 0 200 300"
            className="w-48 h-72 drop-shadow-[0_0_20px_rgba(6,182,212,0.25)]"
          >
            {/* Ambient Body Wireframe Outline */}
            <path
              d="M 100 20 
                 C 90 20, 85 28, 85 40 
                 C 85 52, 90 60, 95 62
                 L 80 72
                 L 58 100
                 L 46 170
                 L 56 174
                 L 68 116
                 L 82 110
                 L 82 170
                 L 74 270
                 L 88 274
                 L 96 186
                 L 100 186
                 L 104 186
                 L 112 274
                 L 126 270
                 L 118 170
                 L 118 110
                 L 132 116
                 L 144 174
                 L 154 170
                 L 142 100
                 L 120 72
                 L 105 62
                 C 110 60, 115 52, 115 40
                 C 115 28, 110 20, 100 20 Z"
              fill="rgba(15, 23, 42, 0.85)"
              stroke="rgba(56, 189, 248, 0.55)"
              strokeWidth="2"
              strokeDasharray="4 2"
            />

            {/* Glowing Sensor Nodes */}
            {nodes.map((node) => {
              const isSelected = activeNode === node.id;
              return (
                <g
                  key={node.id}
                  onClick={() => setActiveNode(node.id)}
                  className="cursor-pointer transition-transform duration-200 hover:scale-125"
                >
                  <circle
                    cx={node.cx}
                    cy={node.cy}
                    r={node.r + 5}
                    fill={node.color}
                    opacity={isSelected ? 0.45 : 0.2}
                    className="animate-ping"
                  />
                  <circle
                    cx={node.cx}
                    cy={node.cy}
                    r={node.r}
                    fill={node.color}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Sensor Telemetry Card & Organ List */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-500/40 bg-cyan-950/30 p-4 shadow-md">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
              Active Sensor Telemetry
            </div>
            <div className="text-base font-bold text-white mt-1">
              {current.name}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-mono text-slate-200 font-medium">{current.val}</span>
              <span
                className={`rounded-md px-2 py-0.5 font-mono text-xs font-bold ${
                  current.status === "Alert"
                    ? "bg-rose-950 text-rose-300 border border-rose-500/50"
                    : current.status === "Watch"
                    ? "bg-amber-950 text-amber-300 border border-amber-500/50"
                    : "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                }`}
              >
                {current.status}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs sm:text-sm">
            {nodes.slice(0, 5).map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setActiveNode(n.id)}
                className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 transition text-left border ${
                  activeNode === n.id
                    ? "bg-slate-900 text-white font-bold border-cyan-400 shadow-sm"
                    : "text-slate-300 hover:bg-slate-900/60 hover:text-white border-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: n.color }}
                  />
                  <span className="truncate">{n.name.split(" ")[0]}</span>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-400">
                  {n.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
