"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export type TabId = "vitals" | "alerts" | "ai" | "brief" | "chat";

const TABS: { id: TabId; label: string }[] = [
  { id: "vitals", label: "Vitals" },
  { id: "alerts", label: "Alerts" },
  { id: "ai", label: "AI & rules" },
  { id: "brief", label: "Brief" },
  { id: "chat", label: "Chat" },
];

interface BottomTabsProps {
  active: TabId;
  onChange: (t: TabId) => void;
  alertsBadge?: number;
}

export function BottomTabs({ active, onChange, alertsBadge }: BottomTabsProps) {
  return (
    <nav
      role="tablist"
      aria-label="Dashboard sections"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-white/10 bg-bg-deep/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      {TABS.map((t) => {
        const isOn = active === t.id;
        return (
          <motion.button
            key={t.id}
            id={`mobile-tab-${t.id}`}
            role="tab"
            aria-selected={isOn}
            aria-controls="mobile-dashboard-panel"
            onClick={() => onChange(t.id)}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "tappable relative flex flex-col items-center justify-center gap-0.5 px-2 py-2 text-sm font-medium transition-colors",
              isOn ? "text-accent" : "text-white/65 hover:text-ink"
            )}
          >
            <span>{t.label}</span>
            {t.id === "alerts" && alertsBadge && alertsBadge > 0 ? (
              <span
                aria-label={`${alertsBadge} active alerts`}
                className="absolute right-2 top-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-bad px-1 text-[0.625rem] font-semibold text-white"
              >
                {alertsBadge}
              </span>
            ) : null}
          </motion.button>
        );
      })}
    </nav>
  );
}
