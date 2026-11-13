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
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useI18n } from "@/lib/i18nContext";

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
  const { t, locale, formatNumber } = useI18n();
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "ai" | "consult" | "biolink"
  >("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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
  const [consumedCalories, setConsumedCalories] = useState(1350 + crew.id * 120);
  const [proteinPct, setProteinPct] = useState(51 + crew.id * 4);
  const [sosSentToast, setSosSentToast] = useState(false);

  // Filter messages to this astronaut ONLY (strict user isolation)
  const isolatedMessages = consultMessages.filter(
    (m) => m.crewIndex === crew.id
  );

  const doctorTransmissions = isolatedMessages.filter(
    (m) => m.senderRole === "doctor"
  );

  // Active deterministic rule alerts for this specific crew member (0=stable, 1=watch, 2=alert)
  const activeCrewAlerts = crew.R?.filter((r) => r.lv > 0) || [];
  const totalNotifications = doctorTransmissions.length + activeCrewAlerts.length;

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
      {/* Astronaut Portal Left Sidebar - Collapsible & Sticky to eliminate dead space */}
      <aside
        className={`w-full border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950 p-4 transition-all duration-300 flex flex-col justify-between shrink-0 md:sticky md:top-0 md:h-screen md:self-start md:overflow-y-auto ${
          sidebarCollapsed ? "md:w-20 items-center" : "md:w-72"
        }`}
      >
        <div className="w-full">
          {/* Brand Header */}
          <div
            className={`flex items-center mb-6 ${
              sidebarCollapsed
                ? "flex-col justify-center gap-2"
                : "justify-between gap-3"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-white">
                    {t("appName")}
                  </h1>
                  <p className="font-mono text-sm font-bold text-cyan-400 uppercase tracking-wider">
                    {t("astronautConsole")}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-cyan-500/40 transition text-sm font-mono"
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {sidebarCollapsed ? "▶" : "◀"}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2.5 w-full">
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              title={t("navTelemetry")}
              className={`w-full flex items-center rounded-xl transition ${
                sidebarCollapsed
                  ? "justify-center p-3.5"
                  : "gap-3 px-4 py-3 text-sm font-bold"
              } ${
                activeTab === "dashboard"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              {!sidebarCollapsed && <span>{t("navTelemetry")}</span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ai")}
              title={t("navAiCopilot")}
              className={`w-full flex items-center rounded-xl transition ${
                sidebarCollapsed
                  ? "justify-center p-3.5"
                  : "gap-3 px-4 py-3 text-sm font-bold"
              } ${
                activeTab === "ai"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
              {!sidebarCollapsed && <span>{t("navAiCopilot")}</span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("consult")}
              title={t("navTeleHealth")}
              className={`w-full flex items-center rounded-xl transition ${
                sidebarCollapsed
                  ? "justify-center p-3.5 relative"
                  : "justify-between px-4 py-3 text-sm font-bold"
              } ${
                activeTab === "consult"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {!sidebarCollapsed && <span>{t("navTeleHealth")}</span>}
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("biolink")}
              title={t("navBioLink")}
              className={`w-full flex items-center rounded-xl transition ${
                sidebarCollapsed
                  ? "justify-center p-3.5"
                  : "gap-3 px-4 py-3 text-sm font-bold"
              } ${
                activeTab === "biolink"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
              </svg>
              {!sidebarCollapsed && <span>{t("navBioLink")}</span>}
            </button>
          </nav>
        </div>

        {/* User Card in Sidebar */}
        <div className="pt-4 border-t border-slate-800 space-y-3 w-full">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 to-blue-800 font-bold text-base text-white shadow shrink-0">
                {user.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-base font-bold text-white truncate">
                  {user.name}
                </div>
                <div className="font-mono text-sm text-cyan-400 font-semibold truncate">
                  {user.callSign} · {user.roleTitle.split("&")[0]}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={`${user.name} (${user.callSign})`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 to-blue-800 font-bold text-sm text-white shadow">
                {user.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onSignOut}
            className={`w-full flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 font-mono text-sm font-bold text-slate-200 hover:bg-rose-950 hover:text-rose-200 hover:border-rose-500/50 transition shadow-sm ${
              sidebarCollapsed ? "p-3" : "gap-2 py-3"
            }`}
            title={t("signOut")}
          >
            <span>[→</span>
            {!sidebarCollapsed && <span>{t("signOut")}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            {sidebarCollapsed && (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 transition font-mono text-xs"
                title="Expand Navigation Sidebar"
              >
                ▶
              </button>
            )}
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
                <span>{t("missionConsole")}</span>
                <span className="font-mono text-xs sm:text-sm font-semibold text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                  {user.name} ({user.callSign})
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
                {t("continuousMonitoring")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            <button
              type="button"
              onClick={handleSosClick}
              className="rounded-xl border border-rose-500/60 bg-rose-600/30 px-5 py-2.5 font-mono text-sm font-bold uppercase tracking-wider text-rose-200 hover:bg-rose-600/50 shadow-lg shadow-rose-950/50 transition flex items-center gap-2"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400 animate-ping" />
              <span>{t("emergencySos")}</span>
            </button>

            {/* Medical Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                  totalNotifications > 0
                    ? "border-cyan-500/60 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 shadow-md shadow-cyan-950"
                    : "border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
                }`}
                title={t("notificationsTitle")}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {totalNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[11px] font-bold text-slate-950 ring-2 ring-slate-950 animate-pulse">
                    {formatNumber(totalNotifications)}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:right-0 top-20 sm:top-12 z-50 w-auto sm:w-96 rounded-2xl border border-slate-700 bg-slate-950 p-4 shadow-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                      {t("notificationsTitle")} ({formatNumber(totalNotifications)})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-white text-xs font-mono"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {/* Active Rule Alerts */}
                    {activeCrewAlerts.map((alt, idx) => (
                      <div
                        key={`rule-${idx}`}
                        className={`rounded-xl border p-3 text-left space-y-1 ${
                          alt.lv === 2
                            ? "border-rose-500/50 bg-rose-950/40"
                            : "border-amber-500/50 bg-amber-950/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-mono text-xs font-bold ${
                              alt.lv === 2 ? "text-rose-300" : "text-amber-300"
                            }`}
                          >
                            {alt.lv === 2 ? "CRITICAL ALARM" : "TELEMETRY WATCH"}: {alt.n}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">Live</span>
                        </div>
                        <p className="text-xs text-slate-200">
                          {alt.why || `Threshold crossed: ${alt.th}`}
                        </p>
                      </div>
                    ))}

                    {/* Surgeon Transmissions */}
                    {doctorTransmissions.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => {
                          setActiveTab("consult");
                          setShowNotifications(false);
                        }}
                        className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-3 hover:border-cyan-500/40 transition text-left"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-cyan-300">
                            Dr. Evelyn Vance
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {msg.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 mt-1 line-clamp-2">
                          {msg.text}
                        </p>
                      </div>
                    ))}

                    {totalNotifications === 0 && (
                      <div className="text-center py-4 text-xs font-mono text-slate-400 italic">
                        No medical transmissions or telemetry alarms. Status nominal.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 font-mono text-xs font-bold text-cyan-300">
              {clockStr}
            </div>
          </div>
        </div>

        {/* SOS Confirmation Banner */}
        {sosSentToast && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-rose-500 bg-rose-950/80 p-4 text-center font-mono text-sm text-rose-200 font-bold shadow-xl animate-in slide-in-from-top">
            <svg className="w-5 h-5 text-rose-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>{t("sosBannerMsg")}</span>
          </div>
        )}

        {/* TAB 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Vitals Summary Strip with Large Figures */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-md">
                <span className="font-mono text-xs sm:text-sm uppercase font-bold text-slate-300 block mb-1.5">
                  {t("heartRate")}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-rose-400">
                    {formatNumber(Math.round(crew.hr))}
                  </span>
                  <span className="text-xs sm:text-sm font-mono text-slate-400 font-bold">{t("bpm")}</span>
                </div>
                <span
                  className={`font-mono text-xs sm:text-sm mt-1.5 block font-semibold ${
                    crew.hr > crew.bhr * 1.3
                      ? "text-rose-400"
                      : crew.hr > crew.bhr * 1.15
                      ? "text-amber-400"
                      : "text-slate-400"
                  }`}
                >
                  {crew.hr > crew.bhr * 1.3
                    ? t("elevatedWatch")
                    : crew.hr > crew.bhr * 1.15
                    ? t("mildExertion")
                    : `${t("baseline")}: ${formatNumber(crew.bhr)} ${t("bpm")}`}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-md">
                <span className="font-mono text-xs sm:text-sm uppercase font-bold text-slate-300 block mb-1.5">
                  {t("bloodOxygen")}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-cyan-300">
                    {formatNumber(crew.spo2.toFixed(1))}%
                  </span>
                </div>
                <span
                  className={`font-mono text-xs sm:text-sm font-semibold mt-1.5 block ${
                    crew.spo2 < 92
                      ? "text-rose-400"
                      : crew.spo2 < 95
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {crew.spo2 < 92 ? t("hypoxicAlert") : crew.spo2 < 95 ? t("marginalDiffusion") : t("optimalDiffusion")}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-md">
                <span className="font-mono text-xs sm:text-sm uppercase font-bold text-slate-300 block mb-1.5">
                  {t("sleepAvg")}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-indigo-300">
                    {formatNumber(crew.sleep.toFixed(1))}h
                  </span>
                </div>
                <span
                  className={`font-mono text-xs sm:text-sm font-semibold mt-1.5 block ${
                    crew.sleep < 5.5 ? "text-amber-400" : "text-slate-400"
                  }`}
                >
                  {crew.sleep < 5.5 ? t("deficitWatch") : t("rollingNight")}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-md">
                <span className="font-mono text-xs sm:text-sm uppercase font-bold text-slate-300 block mb-1.5">
                  {t("stressIndex")}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-400">
                    {formatNumber(Math.round(crew.stress))}
                  </span>
                  <span className="text-xs sm:text-sm font-mono text-slate-400 font-bold">/100</span>
                </div>
                <span
                  className={`font-mono text-xs sm:text-sm font-semibold mt-1.5 block ${
                    crew.stress > 50 ? "text-amber-400" : "text-slate-400"
                  }`}
                >
                  {crew.stress > 50 ? t("elevatedStrain") : t("autonomicBalance")}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-md col-span-2 sm:col-span-1">
                <span className="font-mono text-xs sm:text-sm uppercase font-bold text-slate-300 block mb-1.5">
                  {t("dose30d")}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-purple-300">
                    {formatNumber(crew.dose.toFixed(0))}
                  </span>
                  <span className="text-xs sm:text-sm font-mono text-slate-400 font-bold">mSv</span>
                </div>
                <span
                  className={`font-mono text-xs sm:text-sm font-semibold mt-1.5 block ${
                    crew.rate > 0.5 ? "text-amber-400" : "text-slate-400"
                  }`}
                >
                  {crew.rate > 0.5 ? `${t("speSurgeWatch")} · ${formatNumber(crew.rate.toFixed(2))} mSv/h` : `${t("rate")}: ${formatNumber(crew.rate.toFixed(2))} mSv/h`}
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
            <MicroArrayAssay crew={crew} />

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
                  <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                    <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                    </svg>
                    <span>{t("aiCopilotTitle")}</span>
                  </h3>
                  <p className="text-sm text-slate-300 font-medium mt-1">
                    {t("aiCopilotSubtitle")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onGenerateBrief}
                  disabled={briefLoading}
                  className="rounded-xl bg-cyan-600 px-6 py-3 font-mono text-sm font-bold text-white hover:bg-cyan-500 transition disabled:opacity-50 shadow-lg shadow-cyan-600/25"
                >
                  {briefLoading ? t("briefGenerating") : t("generateHealthBrief")}
                </button>
              </div>

              {/* Brief Display */}
              {briefError && (
                <div className="mb-5 rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 text-sm text-rose-300 font-mono">
                  {briefError}
                </div>
              )}

              {briefText ? (
                <div className="mb-6 rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-6 font-mono text-base sm:text-lg leading-relaxed text-slate-100 whitespace-pre-line shadow-inner">
                  {briefText}
                </div>
              ) : (
                <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center font-mono text-sm text-slate-400">
                  {t("noBriefYet")}
                </div>
              )}

              {/* Interactive AI Chat */}
              <div className="border-t border-slate-800 pt-5">
                <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-200 mb-3">
                  {t("askAboutVitals")}
                </h4>

                <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
                  {chatMessages.length === 0 ? (
                    <div className="text-sm font-mono text-slate-400 italic">
                      {locale === "bn"
                        ? "আপনার কার্ডিওভাসকুলার রিকভারি, ঘুম বা হাইড্রেশন বৃদ্ধি সম্পর্কে প্রশ্ন করুন।"
                        : "Ask questions like \"How is my cardiovascular recovery?\" or \"Should I increase hydration?\""}
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl text-sm sm:text-base leading-relaxed ${
                          msg.role === "user"
                            ? "bg-cyan-950/60 border border-cyan-500/30 text-cyan-200 ml-8 font-medium"
                            : "bg-slate-900 border border-slate-800 text-slate-100 mr-8 font-medium"
                        }`}
                      >
                        <span className="font-mono text-xs font-bold text-slate-400 uppercase block mb-1">
                          {msg.role === "user" ? t("you") : t("medicalAssistant")}
                        </span>
                        <p className="whitespace-pre-line">{msg.content}</p>
                      </div>
                    ))
                  )}
                  {chatStreaming && (
                    <div className="text-sm font-mono text-cyan-400 animate-pulse">
                      {locale === "bn" ? "এআই উত্তর তৈরি করছে..." : "AI is generating reply..."}
                    </div>
                  )}
                  {chatError && (
                    <div className="text-sm font-mono text-rose-400">
                      {chatError}
                    </div>
                  )}
                </div>

                <form onSubmit={handleAiSubmit} className="flex gap-2.5">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder={t("askPlaceholder")}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm sm:text-base text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none font-mono"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-cyan-600 px-6 py-3 font-mono text-sm font-bold text-white hover:bg-cyan-500 transition shadow-md shadow-cyan-600/30"
                  >
                    {t("send")}
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
