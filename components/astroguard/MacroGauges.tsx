"use client";

import { useI18n } from "@/lib/i18nContext";

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
  const { locale, t, formatNumber } = useI18n();

  const macros = [
    {
      label: t("protein"),
      pct: proteinPct,
      detail: locale === "bn"
        ? `${formatNumber(Math.round((proteinPct / 100) * 95))} / ${formatNumber(95)} গ্রাম`
        : `${Math.round((proteinPct / 100) * 95)} / 95g`,
      stroke: "#06b6d4",
    },
    {
      label: t("healthyFats"),
      pct: fatsPct,
      detail: locale === "bn"
        ? `${formatNumber(Math.round((fatsPct / 100) * 70))} / ${formatNumber(70)} গ্রাম`
        : `${Math.round((fatsPct / 100) * 70)} / 70g`,
      stroke: "#f59e0b",
    },
    {
      label: t("fiber"),
      pct: fiberPct,
      detail: locale === "bn"
        ? `${formatNumber(Math.round((fiberPct / 100) * 32))} / ${formatNumber(32)} গ্রাম`
        : `${Math.round((fiberPct / 100) * 32)} / 32g`,
      stroke: "#10b981",
    },
    {
      label: t("water"),
      pct: waterPct,
      detail: locale === "bn"
        ? `${formatNumber(((waterPct / 100) * 2.8).toFixed(2))} / ${formatNumber(2.8)} লিটার`
        : `${((waterPct / 100) * 2.8).toFixed(2)} / 2.8L`,
      stroke: "#38bdf8",
    },
  ];

  const calPct = Math.min(100, Math.round((caloriesKcal / maxCalories) * 100));

  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl font-sans ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <h3 className="font-mono text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200">
            {t("macroHudTitle")}
          </h3>
        </div>
        <span className="font-mono text-xs sm:text-sm font-semibold text-cyan-300">
          {t("macroHudSubtitle")}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {macros.map((m) => {
          const radius = 38;
          const circ = 2 * Math.PI * radius;
          const strokeDashoffset = circ - (m.pct / 100) * circ;

          return (
            <div
              key={m.label}
              className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm"
            >
              <div className="relative flex items-center justify-center w-28 h-28 my-1">
                <svg
                  className="w-28 h-28 transform -rotate-90"
                  viewBox="0 0 100 100"
                  width="112"
                  height="112"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="rgba(51, 65, 85, 0.4)"
                    strokeWidth="7"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke={m.stroke}
                    strokeWidth="7"
                    strokeDasharray={circ}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-mono text-xl sm:text-2xl font-extrabold text-white">
                    {formatNumber(m.pct)}%
                  </span>
                </div>
              </div>
              <span className="mt-3 text-base sm:text-lg font-extrabold text-white text-center">
                {m.label}
              </span>
              <span className="font-mono text-xs sm:text-sm text-slate-300 font-bold mt-1 text-center">
                {m.detail}
              </span>
            </div>
          );
        })}
      </div>

      {/* Energy / Basal Reserve Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-3">
        <div className="flex items-center justify-between text-sm sm:text-base">
          <span className="font-mono text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
            {t("energyReserve")}
          </span>
          <div className="font-mono text-sm sm:text-base">
            <span className="font-extrabold text-cyan-300 text-lg">{formatNumber(caloriesKcal)}</span>
            <span className="text-slate-300 font-semibold"> / {formatNumber(maxCalories)} kcal</span>
          </div>
        </div>

        <div className="h-3.5 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400 transition-all duration-500"
            style={{ width: `${calPct}%` }}
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-mono text-slate-200">
          <span>{t("remaining")}: <strong className="text-white text-sm sm:text-base">{formatNumber(maxCalories - caloriesKcal)} kcal</strong></span>
          <span className="text-cyan-300 font-bold">
            {t("hydrationIndex")}: {formatNumber((76.0 + (waterPct > 50 ? (waterPct - 50) * 0.14 : 0) - (calPct > 80 ? 0.8 : 0)).toFixed(1))}%
          </span>
          <span
            className={`rounded-lg px-2.5 py-1 text-xs sm:text-sm font-bold border ${
              calPct < 40
                ? "bg-amber-950 text-amber-300 border-amber-500/40"
                : calPct > 90
                ? "bg-cyan-950 text-cyan-300 border-cyan-500/40"
                : "bg-emerald-950 text-emerald-300 border-emerald-500/40"
            }`}
          >
            {calPct < 40 ? t("calorieDeficit") : calPct > 90 ? t("metabolicPeak") : t("metabolicNominal")}
          </span>
        </div>
      </div>
    </div>
  );
}
