"use client";

import { useState } from "react";
import type { Crew, ChatMessage } from "@/lib/types";
import type {
  AstroUser,
  ConsultMessage,
  IoTSensorDevice,
  NutritionItem,
  ActiveCallState,
} from "@/lib/astroGuardTypes";
import { ECGMonitor } from "./ECGMonitor";
import { BioScanBody } from "./BioScanBody";
import { MacroGauges } from "./MacroGauges";
import { MicroArrayAssay } from "./MicroArrayAssay";
import { RfidMealScanner } from "./RfidMealScanner";
import { Timeline24hChart } from "./Timeline24hChart";
import { BioLinkView } from "./BioLinkView";
import { MedicalConsultView } from "./MedicalConsultView";
import { CallModal } from "./CallModal";

interface AstronautPortalProps {
  user: AstroUser;
  crew: Crew;
  allCrew: Crew[];
  clockStr: string;
  consultMessages: ConsultMessage[];
  sensors: IoTSensorDevice[];
  onSendMessageToDoctor: (text: string) => void;
  onSendVoiceNoteToDoctor: () => void;
  onTriggerSos: () => void;
  onToggleSensor: (sensorId: string) => void;
  onSignOut: () => void;
  // LLM hooks
  onAskAi: (question: string) => void;
  onGenerateBrief: () => void;
  briefText: string | null;
  briefLoading: boolean;
  briefError: string | null;
  chatMessages: ChatMessage[];
  chatStreaming: boolean;
  chatError: string | null;
}

export function AstronautPortal({
  user,
  crew,
  clockStr,
  consultMessages,
  sensors,
  onSendMessageToDoctor,
  onSendVoiceNoteToDoctor,
  onTriggerSos,
  onToggleSensor,
  onSignOut,
  onAskAi,
  onGenerateBrief,
  briefText,
  briefLoading,
  briefError,
  chatMessages,
  chatStreaming,
  chatError,
}: AstronautPortalProps) {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "ai" | "consult" | "biolink"
  >("dashboard");

  const [callState, setCallState] = useState<ActiveCallState>({
    isOpen: false,
    type: "audio",
    targetCrewIndex: crew.id,
    crewName: "Dr. Evelyn Vance (Chief Flight Surgeon)",
    isMuted: false,
    isVideoMuted: false,
    durationSeconds: 0,
  });

  const [aiInput, setAiInput] = useState("");
  const [consumedCalories, setConsumedCalories] = useState(1350);
  const [proteinPct, setProteinPct] = useState(51);
  const [sosSentToast, setSosSentToast] = useState(false);

  // Filter messages to this astronaut ONLY (strict user isolation)
  const isolatedMessages = consultMessages.filter(
    (m) => m.crewIndex === crew.id
  );

  const handleScanMeal = (item: NutritionItem) => {
    setConsumedCalories((prev) => Math.min(2600, prev + item.caloriesKcal));
    setProteinPct((prev) => Math.min(100, prev + Math.round(item.proteinG / 2)));
  };

  const handleStartCall = (type: "audio" | "video") => {
    setCallState({
      isOpen: true,
      type,
      targetCrewIndex: crew.id,
      crewName: "Dr. Evelyn Vance (Chief Flight Surgeon)",
      isMuted: false,
      isVideoMuted: false,
      durationSeconds: 0,
    });
  };

  const handleSosClick = () => {
    onTriggerSos();
    setSosSentToast(true);
    setTimeout(() => {
      setSosSentToast(false);
    }, 4000);
  };

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    onAskAi(aiInput.trim());
    setAiInput("");
  };

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Astronaut Portal Left Sidebar */}
      <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950 p-4 md:p-5 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3.5 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-2xl shadow-lg shadow-cyan-500/25">
              🛡️
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">
                AstroGuard
              </h1>
              <p className="font-mono text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Astronaut Console
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activeTab === "dashboard"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 font-bold"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <span className="text-base">📊</span>
              <span>Mission Telemetry</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ai")}
              className={`w-full flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activeTab === "ai"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 font-bold"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <span className="text-base">🧠</span>
              <span>AI Health Copilot</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("consult")}
              className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activeTab === "consult"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 font-bold"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span className="text-base">💬</span>
                <span>Doctor Tele-Health</span>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("biolink")}
              className={`w-full flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activeTab === "biolink"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 font-bold"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <span className="text-base">📡</span>
              <span>Bio-Link (IoT Wearables)</span>
            </button>
          </nav>
        </div>

        {/* User Card in Sidebar */}
        <div className="pt-5 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 to-blue-800 font-bold text-sm text-white shadow">
              {user.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white truncate">
                {user.name}
              </div>
              <div className="font-mono text-xs text-cyan-400 font-semibold truncate">
                {user.callSign} · {user.roleTitle.split("&")[0]}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 py-2.5 font-mono text-xs font-bold text-slate-200 hover:bg-rose-950 hover:text-rose-200 hover:border-rose-500/50 transition shadow-sm"
          >
            <span>[→ Sign Out to Gateway]</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl backdrop-blur-md">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <span>Mission Console</span>
              <span className="font-mono text-xs font-semibold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                {user.name} ({user.callSign})
              </span>
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Continuous physiological monitoring, nutrition telemetry &amp; flight surgeon uplink
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSosClick}
              className="rounded-xl border border-rose-500/60 bg-rose-600/30 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-rose-200 hover:bg-rose-600/50 shadow-lg shadow-rose-950/50 transition animate-pulse"
            >
              🚨 Emergency SOS
            </button>
            <div className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 font-mono text-xs font-bold text-cyan-300">
              {clockStr}
            </div>
          </div>
        </div>

        {/* SOS Confirmation Banner */}
        {sosSentToast && (
          <div className="rounded-2xl border border-rose-500 bg-rose-950/80 p-4 text-center font-mono text-sm text-rose-200 font-bold shadow-xl animate-in slide-in-from-top">
            ⚠ CRITICAL EMERGENCY SOS DISPATCHED TO FLIGHT SURGEON &amp; MISSION CONTROL! Telemetry stream priority elevated.
          </div>
        )}

        {/* TAB 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Vitals Summary Strip with Large Figures */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-md">
                <span className="font-mono text-xs uppercase font-bold text-slate-400 block mb-1">
                  Heart Rate
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-400">
                    {Math.round(crew.hr)}
                  </span>
                  <span className="text-xs font-mono text-slate-400">BPM</span>
                </div>
                <span className="font-mono text-xs text-slate-400 mt-1 block">
                  Baseline: {crew.bhr} BPM
                </span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-md">
                <span className="font-mono text-xs uppercase font-bold text-slate-400 block mb-1">
                  Blood Oxygen
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-300">
                    {crew.spo2.toFixed(1)}%
                  </span>
                </div>
                <span className="font-mono text-xs text-emerald-400 font-semibold mt-1 block">
                  Optimal Diffusion
                </span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-md">
                <span className="font-mono text-xs uppercase font-bold text-slate-400 block mb-1">
                  Sleep Avg
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-300">
                    {crew.sleep.toFixed(1)}h
                  </span>
                </div>
                <span className="font-mono text-xs text-slate-400 mt-1 block">
                  3-Night Rolling
                </span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-md">
                <span className="font-mono text-xs uppercase font-bold text-slate-400 block mb-1">
                  Stress Index
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400">
                    {Math.round(crew.stress)}
                  </span>
                  <span className="text-xs font-mono text-slate-400">/100</span>
                </div>
                <span className="font-mono text-xs text-slate-400 mt-1 block">
                  Autonomic Tone
                </span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-md col-span-2 sm:col-span-1">
                <span className="font-mono text-xs uppercase font-bold text-slate-400 block mb-1">
                  30D Dose
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-300">
                    {crew.dose.toFixed(0)}
                  </span>
                  <span className="text-xs font-mono text-slate-400">mSv</span>
                </div>
                <span className="font-mono text-xs text-slate-400 mt-1 block">
                  Rate: {crew.rate.toFixed(2)} mSv/h
                </span>
              </div>
            </div>

            {/* Live ECG Canvas Monitor */}
            <ECGMonitor
              heartRate={crew.hr}
              leadLabel={`ECG - LEAD II · ${user.callSign} (${crew.n})`}
            />

            {/* Macro & Metabolic Energy HUD */}
            <MacroGauges
              caloriesKcal={consumedCalories}
              proteinPct={proteinPct}
            />

            {/* Micro-Array Assay (Vitamins & Minerals) */}
            <MicroArrayAssay />

            {/* RFID Space-Meal Scanner */}
            <RfidMealScanner onScanItem={handleScanMeal} />

            {/* 24H Timeline Chart & BioScan Body Map */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Timeline24hChart crew={crew} />
              <BioScanBody crew={crew} />
            </div>
          </div>
        )}

        {/* TAB 2: AI ANALYSIS */}
        {activeTab === "ai" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                    <span>🧠</span>
                    <span>AstroGuard Physiological Copilot</span>
                  </h3>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    Synthesizing {user.name}&apos;s verified telemetry snapshot. Rules decide, AI advises.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onGenerateBrief}
                  disabled={briefLoading}
                  className="rounded-xl bg-cyan-600 px-5 py-2.5 font-mono text-xs font-bold text-white hover:bg-cyan-500 transition disabled:opacity-50 shadow-lg shadow-cyan-600/25"
                >
                  {briefLoading ? "Generating Brief..." : "⚡ Generate Health Brief"}
                </button>
              </div>

              {/* Brief Display */}
              {briefError && (
                <div className="mb-5 rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs text-rose-300 font-mono">
                  {briefError}
                </div>
              )}

              {briefText ? (
                <div className="mb-6 rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-5 font-mono text-sm leading-relaxed text-slate-200 whitespace-pre-line shadow-inner">
                  {briefText}
                </div>
              ) : (
                <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-center font-mono text-xs text-slate-400">
                  No brief generated yet. Click &ldquo;Generate Health Brief&rdquo; above to synthesize current telemetry.
                </div>
              )}

              {/* Interactive AI Chat */}
              <div className="border-t border-slate-800 pt-5">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 mb-3">
                  Ask Medical Assistant About Your Vitals
                </h4>

                <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
                  {chatMessages.length === 0 ? (
                    <div className="text-xs font-mono text-slate-400 italic">
                      Ask questions like &ldquo;How is my cardiovascular recovery?&rdquo; or &ldquo;Should I increase hydration?&rdquo;
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-cyan-950/60 border border-cyan-500/30 text-cyan-200 ml-8"
                            : "bg-slate-900 border border-slate-800 text-slate-100 mr-8"
                        }`}
                      >
                        <span className="font-mono text-xs font-bold text-slate-400 uppercase block mb-1">
                          {msg.role === "user" ? "You" : "AI Copilot"}
                        </span>
                        <p className="whitespace-pre-line">{msg.content}</p>
                      </div>
                    ))
                  )}
                  {chatStreaming && (
                    <div className="text-xs font-mono text-cyan-400 animate-pulse">
                      AI is generating reply...
                    </div>
                  )}
                  {chatError && (
                    <div className="text-xs font-mono text-rose-400">
                      {chatError}
                    </div>
                  )}
                </div>

                <form onSubmit={handleAiSubmit} className="flex gap-2.5">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Ask about your vitals, sleep deficit, or exercise protocol..."
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none font-mono"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-cyan-600 px-5 py-2.5 font-mono text-xs font-bold text-white hover:bg-cyan-500 transition shadow-md shadow-cyan-600/30"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MEDICAL CONSULT (STRICTLY ISOLATED MESSAGES) */}
        {activeTab === "consult" && (
          <MedicalConsultView
            messages={isolatedMessages}
            onSendMessage={onSendMessageToDoctor}
            onSendVoiceNote={onSendVoiceNoteToDoctor}
            onStartCall={handleStartCall}
            onTriggerSos={handleSosClick}
          />
        )}

        {/* TAB 4: BIO-LINK (IOT WEARABLES) */}
        {activeTab === "biolink" && (
          <BioLinkView
            sensors={sensors}
            onToggleSensor={onToggleSensor}
            crewName={user.name}
            callSign={user.callSign}
          />
        )}
      </main>

      {/* Simulated Call Modal */}
      <CallModal
        callState={callState}
        onClose={() => setCallState((s) => ({ ...s, isOpen: false }))}
        onToggleMute={() =>
          setCallState((s) => ({ ...s, isMuted: !s.isMuted }))
        }
        onToggleVideo={() =>
          setCallState((s) => ({ ...s, isVideoMuted: !s.isVideoMuted }))
        }
      />
    </div>
  );
}
