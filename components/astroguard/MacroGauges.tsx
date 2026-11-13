"use client";

interface MacroGaugesProps {
  proteinPct?: number;
  fatsPct?: number;
  fiberPct?: number;
  waterPct?: number;
  caloriesKcal?: number;
  maxCalories?: number;
  className?: string;
}

export function MacroGauges({
  proteinPct = 51,
  fatsPct = 49,
  fiberPct = 50,
  waterPct = 59,
  caloriesKcal = 1350,
  maxCalories = 2600,
  className = "",
}: MacroGaugesProps) {
  const macros = [
    {
      label: "Protein",
      pct: proteinPct,
      detail: `${Math.round((proteinPct / 100) * 95)} / 95g`,
      stroke: "#06b6d4",
    },
    {
      label: "Healthy Fats",
      pct: fatsPct,
      detail: `${Math.round((fatsPct / 100) * 70)} / 70g`,
      stroke: "#f59e0b",
    },
    {
      label: "Fiber",
      pct: fiberPct,
      detail: `${Math.round((fiberPct / 100) * 32)} / 32g`,
      stroke: "#10b981",
    },
    {
      label: "Water",
      pct: waterPct,
      detail: `${((waterPct / 100) * 2.8).toFixed(2)} / 2.8L`,
      stroke: "#38bdf8",
    },
  ];

  const calPct = Math.min(100, Math.round((caloriesKcal / maxCalories) * 100));

  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl font-sans ${className}`}
    >
      <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            02 Macro &amp; Metabolic Energy HUD
          </h3>
        </div>
        <span className="font-mono text-xs font-semibold text-cyan-300">
          Target vs Consumed (24H Window)
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {macros.map((m) => {
          const radius = 32;
          const circ = 2 * Math.PI * radius;
          const strokeDashoffset = circ - (m.pct / 100) * circ;

          return (
            <div
              key={m.label}
              className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm"
            >
              <div className="relative flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke="rgba(51, 65, 85, 0.4)"
                    strokeWidth="5"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke={m.stroke}
                    strokeWidth="5"
                    strokeDasharray={circ}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <span className="absolute font-mono text-sm font-bold text-white">
                  {m.pct}%
                </span>
              </div>
              <span className="mt-2 text-sm font-bold text-white">
                {m.label}
              </span>
              <span className="font-mono text-xs text-slate-300 font-medium">
                {m.detail}
              </span>
            </div>
          );
        })}
      </div>

      {/* Energy / Basal Reserve Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-2">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider">
            Energy · Basal Metabolic Reserve
          </span>
          <div className="font-mono text-sm">
            <span className="font-extrabold text-cyan-300 text-base">{caloriesKcal}</span>
            <span className="text-slate-400"> / {maxCalories} kcal</span>
          </div>
        </div>

        <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400 transition-all duration-500"
            style={{ width: `${calPct}%` }}
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-300">
          <span>Remaining: <strong className="text-white">{maxCalories - caloriesKcal} kcal</strong></span>
          <span className="text-cyan-300 font-semibold">Tissue Hydration Index: 77.2%</span>
          <span className="rounded-md bg-emerald-950 px-2 py-0.5 text-emerald-300 font-bold border border-emerald-500/40">
            METABOLIC NOMINAL
          </span>
        </div>
      </div>
    </div>
  );
}
