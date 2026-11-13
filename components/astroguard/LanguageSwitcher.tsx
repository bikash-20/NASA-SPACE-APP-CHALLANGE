"use client";

import { useI18n } from "@/lib/i18nContext";

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n();

  return (
    <div
      className={`inline-flex items-center rounded-xl border border-slate-700 bg-slate-900/90 p-1 font-mono text-xs shadow-md backdrop-blur-md ${className}`}
      role="group"
      aria-label="Language selection"
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition-all duration-200 ${
          locale === "en"
            ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
            : "text-slate-400 hover:text-white hover:bg-slate-800"
        }`}
        title="Switch to English"
      >
        <span>EN</span>
      </button>

      <span className="text-slate-600 px-0.5 select-none">|</span>

      <button
        type="button"
        onClick={() => setLocale("bn")}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition-all duration-200 ${
          locale === "bn"
            ? "bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30"
            : "text-slate-400 hover:text-white hover:bg-slate-800"
        }`}
        title="বাংলা ভাষায় পরিবর্তন করুন"
      >
        <span>বাংলা</span>
      </button>
    </div>
  );
}
