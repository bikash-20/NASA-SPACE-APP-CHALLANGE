"use client";

import { useState } from "react";
import type { Crew, Alert } from "@/lib/types";
import type {
  AstroUser,
  ConsultMessage,
  IoTSensorDevice,
  TriageIncident,
  ActiveCallState,
} from "@/lib/astroGuardTypes";
import { ECGMonitor } from "./ECGMonitor";
import { CallModal } from "./CallModal";
import { BioLinkView } from "./BioLinkView";

interface DoctorHubProps {
  user: AstroUser;
  crewMembers: Crew[];
  alerts: Alert[];
  incidents: TriageIncident[];
  consultMessages: ConsultMessage[];
  sensors: IoTSensorDevice[];
  clockStr: string;
  onSendDoctorReply: (crewIndex: 0 | 1 | 2, text: string) => void;
  onFlagIncident: (incidentId: string) => void;
  onToggleSensor: (sensorId: string) => void;
  onSignOut: () => void;
  onMarkMessagesAsRead?: (crewIndex: 0 | 1 | 2) => void;
}

export function DoctorHub({
  user,
  crewMembers,
  alerts,
  incidents,
  consultMessages,
  sensors,
  clockStr,
  onSendDoctorReply,
  onFlagIncident,
  onToggleSensor,
  onSignOut,
  onMarkMessagesAsRead,
}: DoctorHubProps) {
  const [selectedCrewIdx, setSelectedCrewIdx] = useState<0 | 1 | 2>(0);
  const [activeTab, setActiveTab] = useState<"medical" | "chat" | "fleet">("medical");
  const [filterSeverity, setFilterSeverity] = useState<"all" | "critical" | "warning" | "nominal">("all");
  const [replyText, setReplyText] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  const [callState, setCallState] = useState<ActiveCallState>({
    isOpen: false,
    type: "video",
    targetCrewIndex: 0,
    crewName: crewMembers[0]?.n || "Crew Member",
    isMuted: false,
    isVideoMuted: false,
    durationSeconds: 0,
  });

  const selectedCrew = crewMembers[selectedCrewIdx] || crewMembers[0];

  // Calculate unread notifications
  const unreadMessages = consultMessages.filter(
    (m) => m.senderRole === "astronaut" && m.isReadByDoctor === false
  );
  const unreadIncidents = incidents.filter(
    (i) => i.isSos && i.isReadByDoctor === false
  );
  const totalNotifications = unreadMessages.length + unreadIncidents.length;

  const handleSelectCrew = (idx: 0 | 1 | 2) => {
    setSelectedCrewIdx(idx);
    if (onMarkMessagesAsRead) {
      onMarkMessagesAsRead(idx);
    }
  };

  const handleStartCall = (crewIndex: 0 | 1 | 2, type: "audio" | "video") => {
    const target = crewMembers[crewIndex];
    setCallState({
      isOpen: true,
      type,
      targetCrewIndex: crewIndex,
      crewName: target.n,
      isMuted: false,
      isVideoMuted: false,
      durationSeconds: 0,
    });
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onSendDoctorReply(selectedCrewIdx, replyText.trim());
    setReplyText("");
  };

  // Dynamically merge rule-based simulation alerts into unified clinical triage queue
  const dynamicRuleIncidents: TriageIncident[] = alerts.map((a, idx) => {
    const c = crewMembers[a.i] || crewMembers[0];
    const isCritical = a.lv === 2;
    return {
      id: `rule-alert-${a.i}-${a.n}-${idx}`,
      crewIndex: a.i,
      crewName: c.n,
      callSign: `AST-00${a.i + 1}`,
      title: `${isCritical ? "CRITICAL TELEMETRY ALARM" : "ADVISORY WATCH"}: ${a.n} (${c.n})`,
      detail: a.why
        ? `${a.why}. Deterministic rule validation threshold: ${a.th}.`
        : `Threshold crossed: ${a.th}. Immediate telemetry monitoring recommended.`,
      severity: isCritical ? "critical" : "warning",
      timestamp: "Active Sim",
      isSos: false,
      flaggedToMissionControl: true,
      isReadByDoctor: false,
    };
  });

  const allTriageIncidents = [...dynamicRuleIncidents, ...incidents];

  const criticalCount = allTriageIncidents.filter((i) => i.severity === "critical").length;
  const warningCount = allTriageIncidents.filter((i) => i.severity === "warning").length;

  const filteredIncidents = allTriageIncidents.filter((i) => {
    if (filterSeverity === "all") return true;
    return i.severity === filterSeverity;
  });

  const crewMessages = consultMessages.filter(
    (m) => m.crewIndex === selectedCrewIdx
  );

  // Dynamic physiological derivations for currently selected crew member
  const sysBp = Math.round(116 + (selectedCrew.hr - 65) * 0.42 + selectedCrew.stress * 0.22);
  const diaBp = Math.round(74 + (selectedCrew.hr - 65) * 0.2 + selectedCrew.stress * 0.12);
  const mapBp = Math.round(diaBp + (sysBp - diaBp) / 3);
  const respRate = Math.round(
    14 + (selectedCrew.hr - 60) * 0.08 + (selectedCrew.spo2 < 96 ? (96 - selectedCrew.spo2) * 1.2 : 0)
  );
  const bodyTemp = (
    36.8 +
    (selectedCrew.hr > 90 ? (selectedCrew.hr - 90) * 0.015 : 0) +
    (selectedCrew.dose > 120 ? 0.3 : 0)
  ).toFixed(1);

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation & Status Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-800 bg-slate-950/95 px-4 sm:px-6 py-3.5 backdrop-blur-md shadow-lg">
        <div className="mx-auto flex max-w-[1680px] w-full flex-wrap items-center justify-between gap-3">
          {/* Brand & Doctor Info */}
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-purple-700 text-white shadow-md shadow-rose-600/30">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white">
                  {user.name}
                </h1>
                <span className="rounded-md bg-rose-950 px-2 py-0.5 font-mono text-xs font-semibold text-rose-300 border border-rose-500/40">
                  {user.callSign} · Flight Surgeon
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Medical Operations Hub · Ares Deep-Space Fleet Telemetry
              </p>
            </div>
          </div>

          {/* Center Tabs */}
          <nav className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 p-1 font-mono text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("medical")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 transition ${
                activeTab === "medical"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <span>Clinical Triage</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("chat");
                if (onMarkMessagesAsRead) onMarkMessagesAsRead(selectedCrewIdx);
              }}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 transition ${
                activeTab === "chat"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Tele-Health</span>
              {unreadMessages.length > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] text-white animate-pulse">
                  {unreadMessages.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("fleet")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 transition ${
                activeTab === "fleet"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
              </svg>
              <span>IoT Wearables</span>
            </button>
          </nav>

          {/* Right Tools & Notification Bell */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                  totalNotifications > 0
                    ? "border-rose-500/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 shadow-md shadow-rose-950"
                    : "border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
                }`}
                title="View Notifications"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {totalNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[11px] font-bold text-white ring-2 ring-slate-950 animate-bounce">
                    {totalNotifications}
                  </span>
                )}
              </button>

              {/* Notification Dropdown - Viewport safe (never cuts off left) */}
              {showNotifications && (
                <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:right-0 top-20 sm:top-12 z-50 w-auto sm:w-96 rounded-2xl border border-slate-700 bg-slate-950 p-4 shadow-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                      Notifications ({totalNotifications})
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
                    {totalNotifications === 0 ? (
                      <div className="text-center py-4 text-xs font-mono text-slate-400 italic">
                        No pending alerts. Telemetry nominal.
                      </div>
                    ) : (
                      <>
                        {unreadMessages.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => {
                              handleSelectCrew(m.crewIndex);
                              setActiveTab("chat");
                              setShowNotifications(false);
                            }}
                            className="cursor-pointer rounded-xl border border-cyan-500/40 bg-cyan-950/30 p-3 hover:bg-cyan-900/40 transition space-y-1"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-cyan-300">
                                Transmission from {m.senderName}
                              </span>
                              <span className="font-mono text-[11px] text-slate-400">
                                {m.timestamp}
                              </span>
                            </div>
                            <p className="text-xs text-slate-200 line-clamp-2">
                              {m.text}
                            </p>
                          </div>
                        ))}

                        {unreadIncidents.map((inc) => (
                          <div
                            key={inc.id}
                            onClick={() => {
                              handleSelectCrew(inc.crewIndex);
                              setActiveTab("medical");
                              setShowNotifications(false);
                            }}
                            className="cursor-pointer rounded-xl border border-rose-500/50 bg-rose-950/40 p-3 hover:bg-rose-900/40 transition space-y-1"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-rose-300">
                                ALERT: {inc.title}
                              </span>
                              <span className="font-mono text-[11px] text-slate-400">
                                {inc.timestamp}
                              </span>
                            </div>
                            <p className="text-xs text-slate-200">
                              {inc.detail}
                            </p>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 font-mono text-xs font-bold text-cyan-300">
              {clockStr}
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-1.5 font-mono text-xs font-bold text-slate-200 hover:bg-rose-950 hover:text-rose-200 hover:border-rose-500/40 transition"
            >
              Sign Out [→
            </button>
          </div>
        </div>
      </header>

      {/* Main Full-Width Dashboard Content */}
      <main className="flex-1 w-full max-w-[1680px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* 4 Metric Summary Counter Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-md">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-400 font-bold">
              Assigned Astronauts
            </span>
            <div className="mt-2 text-3xl font-extrabold font-mono text-white">
              {crewMembers.length}
            </div>
            <span className="font-mono text-xs text-cyan-400 font-medium">
              Ares-1 Flight Roster
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-md">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-400 font-bold">
              Advisory Watch
            </span>
            <div className="mt-2 text-3xl font-extrabold font-mono text-amber-400">
              {warningCount}
            </div>
            <span className="font-mono text-xs text-amber-500 font-medium">
              Physiological Drift
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-md">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-400 font-bold">
              Critical Triage
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-rose-400">
                {criticalCount}
              </span>
              {criticalCount > 0 && (
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
            <span className="font-mono text-xs text-rose-400 font-medium">
              Immediate Review
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-md">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-400 font-bold">
              Active Signals
            </span>
            <div className="mt-2 text-3xl font-extrabold font-mono text-cyan-300">
              {incidents.length + alerts.length}
            </div>
            <span className="font-mono text-xs text-slate-300 font-medium">
              Rule + SOS Alarms
            </span>
          </div>
        </div>

        {/* TAB 1: CLINICAL TRIAGE & ECG HUB */}
        {activeTab === "medical" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left Column: Assigned Roster Cards */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                    Assigned Astronaut Roster
                  </h3>
                  <span className="font-mono text-xs text-cyan-400 font-semibold">
                    Select to Scope
                  </span>
                </div>

                <div className="space-y-3">
                  {crewMembers.map((c, idx) => {
                    const isSelected = selectedCrewIdx === idx;
                    const cAlerts = alerts.filter((a) => a.i === idx).length;
                    const hasCritical = c.r?.some((lv) => lv === 2) || c.hr > 115 || c.spo2 < 90;
                    const hasWatch = c.r?.some((lv) => lv === 1) || cAlerts > 0 || c.hr > 90 || c.spo2 < 94;
                    const statusLabel = hasCritical ? "CRITICAL" : hasWatch ? "WATCH" : "NOMINAL";

                    return (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCrew(idx as 0 | 1 | 2)}
                        className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                          isSelected
                            ? "border-cyan-400 bg-slate-900 shadow-xl shadow-cyan-500/15 ring-1 ring-cyan-400"
                            : "border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-white">
                            {c.n}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-wider ${
                              hasCritical
                                ? "bg-rose-950 text-rose-300 border border-rose-500/40"
                                : hasWatch
                                ? "bg-amber-950 text-amber-300 border border-amber-500/40"
                                : "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <div className="font-mono text-xs text-slate-400 mt-0.5">
                          {c.role} · AST-00{idx + 1}
                        </div>

                        <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-3 text-center">
                          <div className="rounded-xl bg-slate-950/80 p-2 border border-slate-800">
                            <span className="text-[11px] font-mono text-slate-400 block uppercase font-medium">
                              Heart Rate
                            </span>
                            <span className="text-sm font-bold font-mono text-rose-400">
                              {Math.round(c.hr)} BPM
                            </span>
                          </div>
                          <div className="rounded-xl bg-slate-950/80 p-2 border border-slate-800">
                            <span className="text-[11px] font-mono text-slate-400 block uppercase font-medium">
                              SpO₂
                            </span>
                            <span className="text-sm font-bold font-mono text-cyan-400">
                              {c.spo2.toFixed(1)}%
                            </span>
                          </div>
                          <div className="rounded-xl bg-slate-950/80 p-2 border border-slate-800">
                            <span className="text-[11px] font-mono text-slate-400 block uppercase font-medium">
                              Alerts
                            </span>
                            <span className="text-sm font-bold font-mono text-amber-400">
                              {cAlerts}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right 2 Columns: Selected Crew Telemetry & Live ECG */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/90 p-5 space-y-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
                      {selectedCrew.n} · Live Cardiovascular Telemetry
                    </h3>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleStartCall(selectedCrewIdx, "audio")}
                      className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/60 px-3.5 py-1.5 font-mono text-xs font-bold text-cyan-300 hover:bg-cyan-900 transition shadow"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <span>Voice Call</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartCall(selectedCrewIdx, "video")}
                      className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-950/60 px-3.5 py-1.5 font-mono text-xs font-bold text-purple-300 hover:bg-purple-900 transition shadow"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                      <span>Video Uplink</span>
                    </button>
                  </div>
                </div>

                {/* Vitals Quadrant */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5">
                    <span className="font-mono text-xs text-slate-400 uppercase font-bold block mb-1">
                      Heart Rate
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-400">
                      {Math.round(selectedCrew.hr)}{" "}
                      <span className="text-xs font-medium text-slate-400">BPM</span>
                    </div>
                    <span
                      className={`font-mono text-xs font-semibold mt-1 block ${
                        selectedCrew.hr > 105
                          ? "text-rose-400"
                          : selectedCrew.hr > 85
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {selectedCrew.hr > 105 ? "Tachycardia Alert" : selectedCrew.hr > 85 ? "Elevated Watch" : "Resting Baseline"}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5">
                    <span className="font-mono text-xs text-slate-400 uppercase font-bold block mb-1">
                      Blood Oxygen
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400">
                      {selectedCrew.spo2.toFixed(1)}%
                    </div>
                    <span
                      className={`font-mono text-xs font-semibold mt-1 block ${
                        selectedCrew.spo2 < 92
                          ? "text-rose-400"
                          : selectedCrew.spo2 < 95
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {selectedCrew.spo2 < 92 ? "Hypoxic Alert" : selectedCrew.spo2 < 95 ? "Marginal Diffusion" : "Optimal Diffusion"}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5">
                    <span className="font-mono text-xs text-slate-400 uppercase font-bold block mb-1">
                      Blood Pressure
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-100">
                      {sysBp}/{diaBp}{" "}
                      <span className="text-xs font-medium text-slate-400">mmHg</span>
                    </div>
                    <span className="font-mono text-xs text-slate-400 font-semibold mt-1 block">
                      MAP ~{mapBp} mmHg
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5">
                    <span className="font-mono text-xs text-slate-400 uppercase font-bold block mb-1">
                      Respiration / Temp
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-100">
                      {respRate}{" "}
                      <span className="text-xs font-medium text-slate-400">Br/min</span>
                    </div>
                    <span
                      className={`font-mono text-xs font-semibold mt-1 block ${
                        parseFloat(bodyTemp) > 37.3 ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {bodyTemp}°C · {parseFloat(bodyTemp) > 37.3 ? "Thermal Drift" : "Normothermic"}
                    </span>
                  </div>
                </div>

                {/* High-Resolution ECG Scope */}
                <ECGMonitor
                  heartRate={selectedCrew.hr}
                  leadLabel={`LEAD II (50 mm/s) · ${selectedCrew.n}`}
                />
              </div>
            </div>

            {/* 2. Clinical Triage & Anomaly Signals */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
                <div>
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                    Clinical Triage &amp; Anomaly Signals
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Prioritized telemetry alarms and astronaut emergency signals
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterSeverity("all")}
                    className={`rounded-xl px-3 py-1.5 font-bold transition ${
                      filterSeverity === "all"
                        ? "bg-cyan-600 text-white shadow"
                        : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    All · {allTriageIncidents.length}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterSeverity("critical")}
                    className={`rounded-xl px-3 py-1.5 font-bold transition ${
                      filterSeverity === "critical"
                        ? "bg-rose-600 text-white shadow"
                        : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    Critical · {criticalCount}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterSeverity("warning")}
                    className={`rounded-xl px-3 py-1.5 font-bold transition ${
                      filterSeverity === "warning"
                        ? "bg-amber-600 text-white shadow"
                        : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    Warning · {warningCount}
                  </button>
                </div>
              </div>

              {/* Triage Incident Cards */}
              <div className="space-y-3">
                {filteredIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border p-4 gap-4 transition ${
                      inc.severity === "critical"
                        ? "border-rose-500/50 bg-rose-950/25 shadow-lg shadow-rose-950/30"
                        : "border-amber-500/40 bg-amber-950/15"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
                        <span
                          className={`rounded-md px-2 py-0.5 font-bold uppercase tracking-wider ${
                            inc.severity === "critical"
                              ? "bg-rose-950 text-rose-300 border border-rose-500/50"
                              : "bg-amber-950 text-amber-300 border border-amber-500/40"
                          }`}
                        >
                          {inc.severity}
                        </span>
                        <span className="text-sm font-bold text-white">
                          {inc.title}
                        </span>
                        <span className="text-slate-400">· {inc.timestamp}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        {inc.detail}
                      </p>
                    </div>

                    {/* Action buttons on card */}
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartCall(inc.crewIndex, "audio")}
                        className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/60 px-3 py-1.5 font-mono text-xs font-bold text-cyan-300 hover:bg-cyan-900 transition shadow"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <span>Voice Call</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartCall(inc.crewIndex, "video")}
                        className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-950/60 px-3 py-1.5 font-mono text-xs font-bold text-purple-300 hover:bg-purple-900 transition shadow"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="23 7 16 12 23 17 23 7" />
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                        <span>Video Uplink</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onFlagIncident(inc.id)}
                        className={`rounded-xl px-3 py-1.5 font-mono text-xs font-bold transition border ${
                          inc.flaggedToMissionControl
                            ? "bg-emerald-950 text-emerald-300 border-emerald-500/50"
                            : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
                        }`}
                      >
                        {inc.flaggedToMissionControl
                          ? "✓ Flagged to Control"
                          : "Flag to Control"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CHAT & TELE-HEALTH CHANNELS */}
        {activeTab === "chat" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[720px]">
            {/* Crew Selector Column */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 space-y-3 shadow-xl">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-3">
                Assigned Tele-Health Channels
              </h3>
              {crewMembers.map((c, idx) => {
                const cUnread = consultMessages.filter(
                  (m) =>
                    m.crewIndex === idx &&
                    m.senderRole === "astronaut" &&
                    m.isReadByDoctor === false
                ).length;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCrew(idx as 0 | 1 | 2)}
                    className={`w-full flex items-center justify-between rounded-2xl p-4 text-left transition border ${
                      selectedCrewIdx === idx
                        ? "bg-slate-900 border-cyan-400 text-white shadow-lg ring-1 ring-cyan-400"
                        : "bg-slate-950/60 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-white">{c.n}</div>
                      <div className="font-mono text-xs text-slate-400 mt-0.5">
                        {c.role} · AST-00{idx + 1}
                      </div>
                    </div>
                    {cUnread > 0 ? (
                      <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white shadow animate-pulse">
                        {cUnread} new
                      </span>
                    ) : (
                      <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Conversation Stream */}
            <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/90 flex flex-col justify-between overflow-hidden shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-900/80">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Direct Flight Surgeon Channel · {selectedCrew.n}
                  </h4>
                  <span className="font-mono text-xs text-emerald-400 font-medium">
                    Encrypted Hab-Station Channel Active
                  </span>
                </div>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleStartCall(selectedCrewIdx, "audio")}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900 transition"
                    title="Start Encrypted Voice Call"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartCall(selectedCrewIdx, "video")}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-500/40 bg-purple-950/60 text-purple-300 hover:bg-purple-900 transition"
                    title="Start Encrypted Video Uplink"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {crewMessages.length === 0 ? (
                  <div className="text-sm font-mono text-slate-400 italic text-center mt-20">
                    No consultation messages logged yet with {selectedCrew.n}.
                  </div>
                ) : (
                  crewMessages.map((m) => {
                    const isDoc = m.senderRole === "doctor";
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          isDoc ? "items-end" : "items-start"
                        }`}
                      >
                        <span className="font-mono text-xs text-slate-400 mb-1">
                          {m.senderName} · {m.timestamp}
                        </span>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
                            isDoc
                              ? "bg-purple-600 text-white rounded-tr-none font-medium"
                              : "bg-slate-900 text-slate-100 rounded-tl-none border border-slate-700"
                          }`}
                        >
                          <p>{m.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Advisory Reply Form */}
              <form
                onSubmit={handleReplySubmit}
                className="flex items-center gap-3 border-t border-slate-800 p-4 bg-slate-900/90"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Send flight surgeon advisory to ${selectedCrew.n}...`}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-5 py-2.5 font-mono text-xs font-bold text-white hover:bg-purple-500 transition shadow-lg shadow-purple-600/30"
                >
                  Send Advisory
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: IOT FLEET STATUS */}
        {activeTab === "fleet" && (
          <BioLinkView
            sensors={sensors}
            onToggleSensor={onToggleSensor}
            crewName={selectedCrew.n}
            callSign={`AST-00${selectedCrewIdx + 1}`}
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
