"use client";

import { useState } from "react";
import type { ConsultMessage } from "@/lib/astroGuardTypes";
import { useI18n } from "@/lib/i18nContext";

interface MedicalConsultViewProps {
  messages: ConsultMessage[];
  onSendMessage: (text: string) => void;
  onSendVoiceNote: () => void;
  onStartCall: (type: "audio" | "video") => void;
  onTriggerSos: () => void;
  doctorName?: string;
  doctorCallSign?: string;
}

export function MedicalConsultView({
  messages,
  onSendMessage,
  onSendVoiceNote,
  onStartCall,
  onTriggerSos,
  doctorName = "Dr. Evelyn Vance",
  doctorCallSign = "MED-002",
}: MedicalConsultViewProps) {
  const { locale, t } = useI18n();
  const [inputText, setInputText] = useState("");
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const toggleVoicePlay = (msgId: string) => {
    if (playingVoiceId === msgId) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(msgId);
      setTimeout(() => {
        setPlayingVoiceId(null);
      }, 5000);
    }
  };

  return (
    <div className="flex flex-col h-[720px] rounded-2xl border border-slate-800 bg-slate-950/90 shadow-xl overflow-hidden font-sans">
      {/* Top Tele-Health Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-900/90 gap-3">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-purple-700 text-base font-bold text-white shadow-md">
              EV
            </div>
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-white">{doctorName}</h3>
              <span className="rounded-md bg-slate-800 px-2.5 py-1 font-mono text-xs sm:text-sm font-bold text-rose-300 border border-slate-700">
                {doctorCallSign} · {t("chiefSurgeonRole")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-mono text-emerald-400 font-bold mt-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {locale === "bn"
                  ? "সরাসরি টেলি-হেলথ সংযোগ সক্রিয় · সুরক্ষিত চ্যানেল"
                  : "Direct Tele-Health Uplink Active · Zero-Delay Secure Channel"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls: Audio Call, Video Call & SOS */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onStartCall("audio")}
            className="flex h-10 px-3.5 items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/60 font-mono text-xs sm:text-sm font-bold text-cyan-300 hover:bg-cyan-900/70 transition shadow"
            title={t("startVoiceCall")}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span className="hidden sm:inline">{t("startVoiceCall")}</span>
          </button>
          <button
            type="button"
            onClick={() => onStartCall("video")}
            className="flex h-10 px-3.5 items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-950/60 font-mono text-xs sm:text-sm font-bold text-purple-300 hover:bg-purple-900/70 transition shadow"
            title={t("startVideoUplink")}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            <span className="hidden sm:inline">{t("startVideoUplink")}</span>
          </button>
          <button
            type="button"
            onClick={onTriggerSos}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/60 bg-rose-600/30 px-4 py-2 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-rose-200 hover:bg-rose-600/50 shadow-lg shadow-rose-950/40 transition animate-pulse"
          >
            <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>{t("sosDispatch")}</span>
          </button>
        </div>
      </div>

      {/* Message History Feed */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                <circle cx="20" cy="10" r="2" />
              </svg>
            </div>
            <div className="text-base font-mono text-slate-200 font-bold">
              {t("medicalChannelOpenWith")} {doctorName}.
            </div>
            <div className="text-xs sm:text-sm font-mono text-slate-300">
              {t("sendVoiceToConsult")}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isAstronaut = m.senderRole === "astronaut";
            const isSystem = m.senderRole === "system";

            if (isSystem) {
              return (
                <div
                  key={m.id}
                  className="mx-auto my-3 max-w-lg rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-2.5 text-center font-mono text-xs sm:text-sm font-bold text-rose-300 shadow"
                >
                  ⚠ {m.text} ({m.timestamp})
                </div>
              );
            }

            return (
              <div
                key={m.id}
                className={`flex flex-col ${
                  isAstronaut ? "items-end" : "items-start"
                }`}
              >
                <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-slate-300 mb-1">
                  <span className="font-bold text-slate-200">{m.senderName}</span>
                  <span>·</span>
                  <span>{m.timestamp}</span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-base leading-relaxed shadow-md ${
                    isAstronaut
                      ? "bg-cyan-600 text-white rounded-tr-none font-medium"
                      : "bg-slate-900 text-slate-100 rounded-tl-none border border-slate-700"
                  }`}
                >
                  {m.voiceNoteDuration ? (
                    <div className="flex items-center gap-3 py-1">
                      <button
                        type="button"
                        onClick={() => toggleVoicePlay(m.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition text-sm text-white"
                      >
                        {playingVoiceId === m.id ? "⏸" : "▶"}
                      </button>
                      <div>
                        <div className="font-bold text-base">{t("voiceDispatch")}</div>
                        <div className="flex items-center gap-2 font-mono text-xs sm:text-sm opacity-90">
                          <span>0:00 / 0:{m.voiceNoteDuration}</span>
                          {playingVoiceId === m.id && (
                            <span className="text-emerald-300 animate-pulse font-bold">
                              ● {t("playingAudio")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-line">{m.text}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 border-t border-slate-800 p-4 bg-slate-900/90"
      >
        <button
          type="button"
          onClick={onSendVoiceNote}
          className="flex h-11 px-4 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 font-mono text-xs sm:text-sm font-bold text-cyan-300 hover:bg-slate-800 transition"
          title={t("voiceNote")}
        >
          <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
          <span className="hidden sm:inline">{t("voiceNote")}</span>
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t("typeConsultPlaceholder")}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
        />

        <button
          type="submit"
          className="rounded-xl bg-cyan-600 px-6 py-3 font-mono text-xs sm:text-sm font-bold text-white hover:bg-cyan-500 transition shadow-lg shadow-cyan-600/30"
        >
          {t("send")}
        </button>
      </form>
    </div>
  );
}
