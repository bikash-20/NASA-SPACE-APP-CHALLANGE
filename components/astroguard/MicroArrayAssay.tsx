"use client";

import type { Crew } from "@/lib/types";

interface MicroArrayAssayProps {
  crew?: Crew;
  className?: string;
}

export function MicroArrayAssay({ crew, className = "" }: MicroArrayAssayProps) {
  const isSleepDeficit = crew ? crew.sleep < 5.5 : false;
  const isHighStress = crew ? crew.stress > 55 : false;
  const isRadiationSurge = crew ? crew.rate > 0.5 || crew.dose > 120 : false;
  const crewOffset = crew ? (crew.id === 0 ? 0 : crew.id === 1 ? -4 : 5) : 0;

  const vitamins = [
    {
      name: "Vitamin A",
      val: `${1750 + crewOffset * 25} IU`,
      pct: 70 + crewOffset,
      status: "ACTIVE",
      color: "from-amber-500 to-yellow-400",
    },
    {
      name: "B-Complex",
      val: isSleepDeficit ? "7.2 mg" : `${(12 + crewOffset * 0.4).toFixed(1)} mg`,
      pct: isSleepDeficit ? 36 : Math.min(100, 60 + crewOffset),
      status: isSleepDeficit ? "DEFICIT" : "ACTIVE",
      color: isSleepDeficit ? "from-rose-500 to-amber-500" : "from-amber-500 to-yellow-400",
    },
    {
      name: "Vitamin C",
      val: isRadiationSurge ? "92 mg" : `${75 + crewOffset} mg`,
      pct: isRadiationSurge ? 95 : Math.min(100, 88 + crewOffset),
      status: "OPTIMAL",
      color: "from-emerald-500 to-teal-400",
    },
    {
      name: "Vitamin D3",
      val: `${550 + crewOffset * 15} IU`,
      pct: 35 + crewOffset,
      status: "DEFICIT",
      color: "from-rose-500 to-amber-500",
    },
    {
      name: "Vitamin E",
      val: isRadiationSurge ? "14 mg" : `${(9 + crewOffset * 0.3).toFixed(1)} mg`,
      pct: isRadiationSurge ? 85 : Math.min(100, 55 + crewOffset),
      status: isRadiationSurge ? "ACTIVE DEFENSE" : "ACTIVE",
      color: isRadiationSurge ? "from-cyan-500 to-emerald-400" : "from-amber-500 to-yellow-400",
    },
    {
      name: "Vitamin K",
      val: `${50 + crewOffset * 2} mcg`,
      pct: 65 + crewOffset,
      status: "ACTIVE",
      color: "from-amber-500 to-yellow-400",
    },
  ];

  const minerals = [
    {
      name: "Iron (Fe)",
      val: `${(5.5 + crewOffset * 0.2).toFixed(1)} mg`,
      pct: 75 + crewOffset,
      status: "OK",
      color: "from-amber-500 to-yellow-400",
    },
    {
      name: "Calcium (Ca)",
      val: `${620 + crewOffset * 20} mg`,
      pct: 45 + crewOffset,
      status: "WATCH",
      color: "from-amber-500 to-orange-400",
    },
    {
      name: "Magnesium (Mg)",
      val: isHighStress ? "165 mg" : `${230 + crewOffset * 8} mg`,
      pct: isHighStress ? 48 : Math.min(100, 80 + crewOffset),
      status: isHighStress ? "WATCH" : "OK",
      color: isHighStress ? "from-amber-500 to-orange-400" : "from-amber-500 to-yellow-400",
    },
    {
      name: "Zinc (Zn)",
      val: `${(6.2 + crewOffset * 0.2).toFixed(1)} mg`,
      pct: 70 + crewOffset,
      status: "OK",
      color: "from-amber-500 to-yellow-400",
    },
    {
      name: "Potassium (K)",
      val: `${1950 + crewOffset * 40} mg`,
      pct: Math.min(100, 88 + crewOffset),
      status: "OPTIMAL",
      color: "from-emerald-500 to-teal-400",
    },
  ];

  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl font-sans ${className}`}
    >
      <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            03 Micro-Array Assay · Biomarker Profiling
          </h3>
        </div>
        <span className="font-mono text-xs font-semibold text-cyan-300">
          Mass Spectrometry · Nominal
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Vitamins */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-3 border-b border-slate-800/80 pb-2">
            Key Vitamins (A, B, C, D3, E, K)
          </div>
          <div className="space-y-3">
            {vitamins.map((v) => (
              <div key={v.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-white font-semibold">{v.name}</span>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-slate-300 font-medium">{v.val}</span>
                    <span
                      className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold ${
                        v.status === "DEFICIT"
                          ? "bg-rose-950 text-rose-300 border border-rose-500/50"
                          : v.status === "OPTIMAL"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-500/50"
                          : "bg-slate-800 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${v.color}`}
                    style={{ width: `${v.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Minerals */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-3 border-b border-slate-800/80 pb-2">
            Essential Minerals (Fe, Ca, Mg, Zn, K)
          </div>
          <div className="space-y-3.5">
            {minerals.map((m) => (
              <div key={m.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-white font-semibold">{m.name}</span>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-slate-300 font-medium">{m.val}</span>
                    <span
                      className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold ${
                        m.status === "WATCH"
                          ? "bg-amber-950 text-amber-300 border border-amber-500/50"
                          : m.status === "OPTIMAL"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-500/50"
                          : "bg-slate-800 text-slate-200 border border-slate-700"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${m.color}`}
                    style={{ width: `${m.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
