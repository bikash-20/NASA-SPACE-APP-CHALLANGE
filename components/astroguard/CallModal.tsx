"use client";

import { useEffect, useState } from "react";
import type { ActiveCallState } from "@/lib/astroGuardTypes";
import { useI18n } from "@/lib/i18nContext";

interface CallModalProps {
  callState: ActiveCallState;
  onClose: () => void;
  onToggleMute: () => void;
  onToggleVideo?: () => void;
}

export function CallModal({
  callState,
  onClose,
  onToggleMute,
  onToggleVideo,
}: CallModalProps) {
  const { locale, t, formatNumber } = useI18n();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!callState.isOpen) {
      setSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callState.isOpen]);

  if (!callState.isOpen) return null;

  const minutes = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  const timerStr = `${String(minutes).padStart(2, "0")}:${String(remSec).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-cyan-500/50 bg-slate-950 p-6 sm:p-8 shadow-2xl shadow-cyan-950/60">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-wider text-cyan-300 font-bold">
              {locale === "bn"
                ? `এনক্রিপ্ট করা টেলি-হেলথ আপলিঙ্ক · ${callState.type === "video" ? "ভিডিও টেলি-উপস্থিতি" : "ভয়েস যোগাযোগ"}`
                : `Encrypted Tele-Health Uplink · ${callState.type === "video" ? "Video Tele-Presence" : "Direct Voice Comm"}`}
            </span>
          </div>
          <span className="rounded-md bg-emerald-950 px-2.5 py-1 font-mono text-xs font-bold text-emerald-300 border border-emerald-500/40">
            ● {formatNumber(timerStr)}
          </span>
        </div>

        {/* Call View Body */}
        <div className="my-6 flex flex-col items-center justify-center">
          {callState.type === "video" && !callState.isVideoMuted ? (
            <div className="relative w-full h-72 rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden flex items-center justify-center shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center">
                <div className="relative flex items-center justify-center">
                  <div className="h-28 w-28 rounded-full border-2 border-cyan-400/50 bg-gradient-to-br from-cyan-600 to-blue-800 flex items-center justify-center text-3xl font-extrabold text-white shadow-xl shadow-cyan-500/30 animate-pulse">
                    {callState.crewName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="absolute -inset-3 rounded-full border border-cyan-400/20 animate-ping" />
                </div>
                <span className="mt-4 text-base font-bold text-white tracking-wide">
                  {callState.crewName}
                </span>
                <span className="font-mono text-xs text-cyan-300 mt-1 font-medium">
                  {locale === "bn"
                    ? "সরাসরি ডিপ-স্পেস ফিড · 1080p 60fps"
                    : "Direct Deep-Space Feed · 1080p 60fps"}
                </span>
              </div>

              {/* HUD Elements */}
              <div className="absolute top-3 left-3 font-mono text-xs text-emerald-300 bg-slate-950/90 px-2.5 py-1 rounded-md border border-emerald-500/40 font-bold">
                {locale === "bn" ? "রেকর্ড ● ১৪.৮ Mbps" : "REC ● 14.8 Mbps"}
              </div>
              <div className="absolute bottom-3 right-3 font-mono text-xs text-slate-300 bg-slate-950/90 px-2.5 py-1 rounded-md border border-slate-800 font-medium">
                Hab-2 Tele-Health Vault
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6">
              <div className="relative flex items-center justify-center">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-teal-500 to-cyan-700 flex items-center justify-center text-3xl font-extrabold text-white shadow-xl shadow-cyan-500/30">
                  {callState.crewName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="absolute -inset-2.5 rounded-full border border-emerald-400/40 animate-pulse" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">
                {callState.crewName}
              </h3>
              <p className="font-mono text-xs text-slate-300 mt-1 font-medium">
                {locale === "bn"
                  ? "সরাসরি ভয়েস আপলিঙ্ক সংযুক্ত · ৪৮ kHz Opus"
                  : "Direct Voice Uplink Connected · 48 kHz Opus"}
              </p>

              {/* Dynamic Sound Wave Simulator */}
              <div className="mt-6 flex items-center gap-2 h-10">
                {[8, 18, 28, 14, 34, 20, 30, 10, 24, 16, 32, 12].map((h, i) => (
                  <div
                    key={i}
                    className="w-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400"
                    style={{
                      height: `${h}px`,
                      animationDelay: `${i * 0.08}s`,
                      animationDuration: "0.7s",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-center gap-5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onToggleMute}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
              callState.isMuted
                ? "bg-rose-950 text-rose-300 border-rose-500/60"
                : "bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800"
            }`}
            title={callState.isMuted ? t("unmuteMic") : t("muteMic")}
          >
            {callState.isMuted ? (
              <svg className="w-5 h-5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            )}
          </button>

          {callState.type === "video" && onToggleVideo && (
            <button
              type="button"
              onClick={onToggleVideo}
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
                callState.isVideoMuted
                  ? "bg-rose-950 text-rose-300 border-rose-500/60"
                  : "bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800"
              }`}
              title={callState.isVideoMuted ? t("enableVideo") : t("disableVideo")}
            >
              {callState.isVideoMuted ? (
                <svg className="w-5 h-5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1" />
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-purple-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex h-12 px-7 items-center justify-center gap-2 rounded-2xl bg-rose-600 font-mono text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-rose-600/40 hover:bg-rose-500 transition"
          >
            <span>{t("terminateCall")}</span>
            <span>✕</span>
          </button>
        </div>
      </div>
    </div>
  );
}
