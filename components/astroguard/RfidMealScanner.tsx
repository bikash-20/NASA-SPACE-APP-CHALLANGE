"use client";

import { useState } from "react";
import { DEFAULT_NUTRITION_ITEMS } from "@/lib/astroGuardData";
import type { NutritionItem } from "@/lib/astroGuardTypes";

interface RfidMealScannerProps {
  onScanItem?: (item: NutritionItem) => void;
  className?: string;
}

export function RfidMealScanner({ onScanItem, className = "" }: RfidMealScannerProps) {
  const [scannedId, setScannedId] = useState<string | null>(null);

  const handleScan = (item: NutritionItem) => {
    setScannedId(item.id);
    if (onScanItem) {
      onScanItem(item);
    }
    setTimeout(() => {
      setScannedId(null);
    }, 1500);
  };

  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl font-sans ${className}`}
    >
      <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            04 RFID Space-Meal Scanner
          </h3>
        </div>
        <span className="font-mono text-xs font-semibold text-slate-300">
          Galley Scanner · Optical RFID Port Armed
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {DEFAULT_NUTRITION_ITEMS.map((item) => {
          const isScanning = scannedId === item.id;

          return (
            <div
              key={item.id}
              className={`flex flex-col justify-between rounded-2xl border p-4 transition-all duration-300 ${
                isScanning
                  ? "border-cyan-400 bg-cyan-950/40 shadow-xl shadow-cyan-500/20 scale-[1.02]"
                  : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-2xl">
                    {item.icon === "water"
                      ? "💧"
                      : item.icon === "meat"
                      ? "🥩"
                      : item.icon === "pill"
                      ? "💊"
                      : "🫐"}
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {item.code}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white line-clamp-1">
                  {item.name}
                </h4>
                <div className="mt-1.5 flex items-center gap-2 font-mono text-xs text-slate-300 font-medium">
                  <span className="text-cyan-300 font-bold">+{item.caloriesKcal} kcal</span>
                  <span>·</span>
                  <span className="text-amber-300 font-bold">+{item.proteinG}g Pro</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleScan(item)}
                className={`mt-4 w-full rounded-xl py-2 font-mono text-xs font-bold tracking-wider uppercase transition border ${
                  isScanning
                    ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-extrabold"
                    : "bg-slate-950 text-cyan-300 border-cyan-500/40 hover:bg-cyan-950 hover:border-cyan-400 hover:text-white"
                }`}
              >
                {isScanning ? "✓ SCANNED & SYNCED" : "TRIGGER RFID"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
