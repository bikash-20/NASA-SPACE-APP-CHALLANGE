"use client";

import { useState } from "react";
import type { IoTSensorDevice } from "@/lib/astroGuardTypes";

interface BioLinkViewProps {
  sensors: IoTSensorDevice[];
  onToggleSensor: (sensorId: string) => void;
  crewName: string;
  callSign: string;
}

export function BioLinkView({
  sensors,
  onToggleSensor,
  crewName,
  callSign,
}: BioLinkViewProps) {
  const [showPairModal, setShowPairModal] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [pairingSuccess, setPairingSuccess] = useState(false);

  const onlineCount = sensors.filter((s) => s.online).length;

  const handlePair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCode) return;
    setPairingSuccess(true);
    setTimeout(() => {
      setPairingSuccess(false);
      setShowPairModal(false);
      setPinCode("");
    }, 1200);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Gateway Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-400 font-bold">
              Edge Gateway Hub
            </span>
            <span className="rounded-md bg-emerald-950 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-300 border border-emerald-500/40">
              ● LIVE 100Hz
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-white">Hab 2 - Rack 4B</div>
          <div className="mt-1 font-mono text-xs text-cyan-300 font-medium">
            Local Mesh BLE 5.3 Active
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-400 font-bold">
              Paired Sensors
            </span>
            <span className="rounded-md bg-cyan-950 px-2.5 py-0.5 font-mono text-xs font-bold text-cyan-300 border border-cyan-500/40">
              BLE 5.3 / USB Link
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-white">
            {onlineCount} of {sensors.length} Online
          </div>
          <div className="mt-1 font-mono text-xs text-slate-300 font-medium">
            Latency &lt; 8ms · Jitter 0.4ms
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-400 font-bold">
              Biometric Vault
            </span>
            <span className="rounded-md bg-purple-950 px-2.5 py-0.5 font-mono text-xs font-bold text-purple-300 border border-purple-500/40">
              TLS 1.3 Certified
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-white">{callSign} · Vault Verified</div>
          <div className="mt-1 font-mono text-xs text-slate-300 font-medium truncate">
            {crewName}
          </div>
        </div>
      </div>

      {/* Sensor Grid Header & Pair Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            Active Biometric Sensors &amp; Wearables ({sensors.length})
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setShowPairModal(true)}
          className="rounded-xl border border-cyan-500/40 bg-cyan-950/60 px-4 py-2 font-mono text-xs font-bold text-cyan-300 hover:bg-cyan-900 transition shadow"
        >
          + Connect by Phone / PIN Number
        </button>
      </div>

      {/* 6 Sensor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sensors.map((s) => (
          <div
            key={s.id}
            className={`flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
              s.online
                ? "border-slate-800 bg-slate-950/80 shadow-md hover:border-cyan-500/50"
                : "border-slate-800/40 bg-slate-950/30 opacity-60"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      s.online ? "bg-emerald-400" : "bg-slate-500"
                    }`}
                  />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
                    {s.online ? "LIVE SIMULATION" : "DISCONNECTED"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleSensor(s.id)}
                  className="text-xs font-mono font-semibold text-slate-400 hover:text-rose-400 transition"
                  title="Toggle Sensor Link"
                >
                  {s.online ? "Disconnect" : "Reconnect"}
                </button>
              </div>

              <div>
                <div className="text-base font-bold text-white flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 border border-slate-800 text-cyan-400 shrink-0">
                    {s.type === "watch" ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="7" />
                        <polyline points="12 9 12 12 13.5 13.5" />
                        <path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7l.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83" />
                      </svg>
                    ) : s.type === "patch" || s.type === "ecg" ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="6" width="20" height="12" rx="4" />
                        <polyline points="6 12 9 12 11 9 13 15 15 12 18 12" />
                      </svg>
                    ) : s.type === "meal" ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l.77.78L12 20.66l7.65-7.65.77-.78a5.4 5.4 0 0 0 0-7.65z" />
                      </svg>
                    )}
                  </div>
                  <span className="truncate">{s.name}</span>
                </div>
                <div className="font-mono text-xs text-slate-400 font-semibold mt-1">{s.code}</div>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-900/80 p-3 font-mono text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Protocol:</span>
                  <span className="text-slate-200 font-semibold">{s.protocol}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Signal RSSI:</span>
                  <span
                    className={`font-semibold ${
                      s.signalRssi > -60 ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {s.signalRssi > -60 ? "EXCELLENT" : "GOOD"} ({s.signalRssi} dBm)
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Battery:</span>
                  <span className="text-cyan-300 font-bold">{s.batteryPct}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Category:</span>
                  <span className="text-slate-300 font-medium">{s.dataCategory}</span>
                </div>
              </div>

              {/* Payload Strip */}
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 font-mono text-xs text-cyan-300">
                <span className="text-[11px] text-slate-400 block uppercase font-bold mb-0.5">
                  Live Stream Payload
                </span>
                <span className="font-bold text-white">{s.livePayload}</span>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-800 pt-3 text-xs font-mono text-slate-400 flex justify-between items-center">
              <span className="truncate text-slate-400">{s.calibrationNote}</span>
              <span className="text-emerald-400 font-bold shrink-0 ml-2">Sync: Just now</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pair Sensor Modal */}
      {showPairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-cyan-500/40 bg-slate-950 p-6 shadow-2xl">
            <h4 className="text-lg font-bold text-white">
              Pair Biometric Sensor / Smartwatch
            </h4>
            <p className="mt-1 text-sm text-slate-300 leading-relaxed">
              Enter the 6-digit Bluetooth/WiFi pairing PIN displayed on your smartwatch or bio-patch.
            </p>

            <form onSubmit={handlePair} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
                  Device Passkey / PIN
                </label>
                <input
                  type="text"
                  placeholder="e.g. 748-291"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-base text-white font-mono focus:border-cyan-400 focus:outline-none"
                  autoFocus
                />
              </div>

              {pairingSuccess && (
                <div className="rounded-xl bg-emerald-950 p-3 text-center text-xs font-mono text-emerald-300 font-bold border border-emerald-500/40">
                  ✓ Pair successful! Handshake verified via TLS 1.3 mesh.
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPairModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-mono text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-5 py-2 text-xs font-mono font-bold text-white hover:bg-cyan-500 transition shadow-lg shadow-cyan-600/30"
                >
                  Confirm &amp; Pair
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
