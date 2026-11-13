"use client";

import type { Crew } from "@/lib/types";
import { useI18n } from "@/lib/i18nContext";

interface MicroArrayAssayProps {
  crew?: Crew;
  className?: string;
}

export function MicroArrayAssay({ crew, className = "" }: MicroArrayAssayProps) {
  const { locale, t, formatNumber } = useI18n();

  const isSleepDeficit = crew ? crew.sleep < 5.5 : false;
  const isHighStress = crew ? crew.stress > 55 : false;
  const isRadiationSurge = crew ? crew.rate > 0.5 || crew.dose > 120 : false;
  const crewOffset = crew ? (crew.id === 0 ? 0 : crew.id === 1 ? -4 : 5) : 0;

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return t("statusActive");
      case "OPTIMAL":
        return t("statusOptimal");
      case "DEFICIT":
        return t("statusDeficit");
      case "WATCH":
        return t("statusWatch");
      case "ACTIVE DEFENSE":
        return t("statusActiveDefense");
      case "OK":
        return t("statusOk");
      default:
        return status;
    }
  };

  const vitamins = [
    {
      name: locale === "bn" ? "ভিটামিন এ (Vitamin A)" : "Vitamin A",
      val: `${formatNumber(1750 + crewOffset * 25)} IU`,
      pct: 70 + crewOffset,
      status: "ACTIVE",
      color: "from-amber-500 to-yellow-400",
    },
    {
      name: locale === "bn" ? "বি-কমপ্লেক্স (B-Complex)" : "B-Complex",
      val: isSleepDeficit ? `${formatNumber(7.2)} mg` : `${formatNumber((12 + crewOffset * 0.4).toFixed(1))} mg`,
      pct: isSleepDeficit ? 36 : Math.min(100, 60 + crewOffset),
      status: isSleepDeficit ? "DEFICIT" : "ACTIVE",
      color: isSleepDeficit ? "from-rose-500 to-amber-500" : "from-amber-500 to-yellow-400",
    },
    {
      name: locale === "bn" ? "ভিটামিন সি (Vitamin C)" : "Vitamin C",
      val: isRadiationSurge ? `${formatNumber(92)} mg` : `${formatNumber(75 + crewOffset)} mg`,
      pct: isRadiationSurge ? 95 : Math.min(100, 88 + crewOffset),
      status: "OPTIMAL",
      color: "from-emerald-500 to-teal-400",
    },
    {
      name: locale === "bn" ? "ভিটামিন ডি৩ (Vitamin D3)" : "Vitamin D3",
      val: `${formatNumber(550 + crewOffset * 15)} IU`,
      pct: 35 + crewOffset,
      status: "DEFICIT",
      color: "from-rose-500 to-amber-500",
    },
    {
      name: locale === "bn" ? "ভিটামিন ই (Vitamin E)" : "Vitamin E",
      val: isRadiationSurge ? `${formatNumber(14)} mg` : `${formatNumber((9 + crewOffset * 0.3).toFixed(1))} mg`,
      pct: isRadiationSurge ? 85 : Math.min(100, 55 + crewOffset),
      status: isRadiationSurge ? "ACTIVE DEFENSE" : "ACTIVE",
      color: isRadiationSurge ? "from-cyan-500 to-emerald-400" : "from-amber-500 to-yellow-400",
    },
    {
      name: locale === "bn" ? "ভিটামিন কে (Vitamin K)" : "Vitamin K",
      val: `${formatNumber(50 + crewOffset * 2)} mcg`,
      pct: 65 + crewOffset,
      status: "ACTIVE",
      color: "from-amber-500 to-yellow-400",
    },
  ];

  const minerals = [
    {
      name: locale === "bn" ? "আয়রন (Iron - Fe)" : "Iron (Fe)",
      val: `${formatNumber((5.5 + crewOffset * 0.2).toFixed(1))} mg`,
      pct: 75 + crewOffset,
      status: "OK",
      color: "from-amber-500 to-yellow-400",
    },
    {
      name: locale === "bn" ? "ক্যালসিয়াম (Calcium - Ca)" : "Calcium (Ca)",
      val: `${formatNumber(620 + crewOffset * 20)} mg`,
      pct: 45 + crewOffset,
      status: "WATCH",
      color: "from-amber-500 to-orange-400",
    },
    {
      name: locale === "bn" ? "ম্যাগনেসিয়াম (Magnesium - Mg)" : "Magnesium (Mg)",
      val: isHighStress ? `${formatNumber(165)} mg` : `${formatNumber(230 + crewOffset * 8)} mg`,
      pct: isHighStress ? 48 : Math.min(100, 80 + crewOffset),
      status: isHighStress ? "WATCH" : "OK",
      color: isHighStress ? "from-amber-500 to-orange-400" : "from-amber-500 to-yellow-400",
    },
    {
      name: locale === "bn" ? "জিঙ্ক (Zinc - Zn)" : "Zinc (Zn)",
      val: `${formatNumber((6.2 + crewOffset * 0.2).toFixed(1))} mg`,
      pct: 70 + crewOffset,
      status: "OK",
      color: "from-amber-500 to-yellow-400",
    },
    {
      name: locale === "bn" ? "পটাশিয়াম (Potassium - K)" : "Potassium (K)",
      val: `${formatNumber(1950 + crewOffset * 40)} mg`,
      pct: Math.min(100, 88 + crewOffset),
      status: "OPTIMAL",
      color: "from-emerald-500 to-teal-400",
    },
  ];

  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl font-sans ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
          <h3 className="font-mono text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200">
            {t("biomarkerTitle")}
          </h3>
        </div>
        <span className="font-mono text-xs sm:text-sm font-semibold text-cyan-300">
          {t("biomarkerSubtitle")}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Vitamins */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
          <div className="text-sm font-mono font-bold uppercase tracking-wider text-slate-200 mb-3.5 border-b border-slate-800/80 pb-2.5">
            {t("keyVitamins")}
          </div>
          <div className="space-y-4">
            {vitamins.map((v) => (
              <div key={v.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm sm:text-base">
                  <span className="text-white font-bold">{v.name}</span>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs sm:text-sm text-slate-200 font-semibold">{v.val}</span>
                    <span
                      className={`rounded-md px-2.5 py-0.5 font-mono text-xs font-bold ${
                        v.status === "DEFICIT"
                          ? "bg-rose-950 text-rose-300 border border-rose-500/50"
                          : v.status === "OPTIMAL"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-500/50"
                          : "bg-slate-800 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {getStatusText(v.status)}
                    </span>
                  </div>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
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
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
          <div className="text-sm font-mono font-bold uppercase tracking-wider text-slate-200 mb-3.5 border-b border-slate-800/80 pb-2.5">
            {t("essentialMinerals")}
          </div>
          <div className="space-y-4">
            {minerals.map((m) => (
              <div key={m.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm sm:text-base">
                  <span className="text-white font-bold">{m.name}</span>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs sm:text-sm text-slate-200 font-semibold">{m.val}</span>
                    <span
                      className={`rounded-md px-2.5 py-0.5 font-mono text-xs font-bold ${
                        m.status === "WATCH"
                          ? "bg-amber-950 text-amber-300 border border-amber-500/50"
                          : m.status === "OPTIMAL"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-500/50"
                          : "bg-slate-800 text-slate-200 border border-slate-700"
                      }`}
                    >
                      {getStatusText(m.status)}
                    </span>
                  </div>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
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
