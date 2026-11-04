"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallBanner() {
  const [ready, setReady] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean(Reflect.get(navigator, "standalone"));
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsInstalled(standalone);
    setIsIos(ios);
    setReady(true);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (!ready || isInstalled || dismissed) return null;

  const install = async () => {
    setError("");
    if (!installPrompt) {
      setShowInstructions((current) => !current);
      return;
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      setInstallPrompt(null);
      if (outcome === "accepted") {
        setIsInstalled(true);
      } else {
        setShowInstructions(true);
      }
    } catch (installError) {
      setError(
        installError instanceof Error
          ? installError.message
          : "The browser could not open the install prompt."
      );
    }
  };

  const instructions = isIos
    ? "Open this page in Safari, tap Share, then choose Add to Home Screen."
    : "Open your browser menu and choose Install app or Add to Home Screen.";

  return (
    <aside
      aria-label="Install Crew Health Monitor"
      className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[70] mx-auto max-w-lg rounded-2xl border border-cyan-200/20 bg-[#0b1524]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:mx-0 sm:w-[min(26rem,calc(100vw-2.5rem))]"
    >
      <div className="flex items-center gap-3">
        <Image
          src="/pwa-icon-192.png"
          alt=""
          width={52}
          height={52}
          unoptimized
          className="h-[52px] w-[52px] shrink-0 rounded-xl border border-white/10"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Take Crew Monitor with you</p>
          <p className="mt-0.5 text-xs leading-relaxed text-white/60">
            Install for quick access to the dashboard, even offline.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss install banner"
          className="self-start rounded-md p-1.5 text-white/55 transition hover:bg-white/10 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-4 w-4"
          >
            <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[0.6875rem] text-white/45">
          {isIos ? "iPhone & iPad" : "Mobile & desktop"}
        </span>
        <button
          type="button"
          onClick={install}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-cyan-200 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1524]"
        >
          {installPrompt
            ? "Install app"
            : isIos
              ? "Add to Home Screen"
              : "Install app"}
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-4 w-4"
          >
            <path
              d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 13.5v2A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5v-2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {showInstructions && (
        <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs leading-relaxed text-white/75">
          {instructions}
        </p>
      )}
      {error && (
        <p className="mt-2 text-xs text-rose-200" role="alert">
          {error}
        </p>
      )}
    </aside>
  );
}
