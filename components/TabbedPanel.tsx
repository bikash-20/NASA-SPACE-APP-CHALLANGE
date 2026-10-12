"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Panel } from "./ui/Panel";
import { cn } from "@/lib/cn";

export type TabKey = "alerts" | "why" | "timeline" | "brief" | "ask";

interface TabbedPanelProps {
  active: TabKey;
  onChange: (k: TabKey) => void;
  alerts: React.ReactNode;
  why: React.ReactNode;
  timeline: React.ReactNode;
  brief: React.ReactNode;
  ask: React.ReactNode;
  alertsBadge?: number;
}

const TABS: { id: TabKey; label: string }[] = [
  { id: "alerts", label: "Alerts" },
  { id: "why", label: "Why" },
  { id: "timeline", label: "Timeline" },
  { id: "brief", label: "Brief" },
  { id: "ask", label: "Chat" },
];

export function TabbedPanel({
  active,
  onChange,
  alerts,
  why,
  timeline,
  brief,
  ask,
  alertsBadge,
}: TabbedPanelProps) {
  return (
    <Panel className="flex min-h-0 flex-col" data-tabbed>
      {/* Tab strip */}
      <div
        role="tablist"
        aria-label="Alert details"
        className="mb-3 flex items-center gap-1 border-b border-white/10"
      >
        {TABS.map((t) => {
          const isOn = active === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isOn}
              aria-controls={`tabpanel-${t.id}`}
              onClick={() => onChange(t.id)}
              className={cn(
                "tappable relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm font-medium",
                isOn ? "text-ink" : "text-white/65 hover:text-ink"
              )}
            >
              {t.id === "ask" && (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path d="M3.5 4.5h13v9h-7l-4 3v-3h-2z" />
                  <path d="M6.5 8h7M6.5 10.5h4.5" />
                </svg>
              )}
              <span>{t.label}</span>
              {t.id === "alerts" && alertsBadge && alertsBadge > 0 ? (
                <span className="ml-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-bad px-1 text-[0.625rem] font-semibold text-white">
                  {alertsBadge}
                </span>
              ) : null}
              {isOn && (
                <motion.span
                  layoutId="tabbed-underline"
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-accent"
                />
              )}
            </button>
          );
        })}
      </div>
      <div
        className={cn(
          "desktop-tab-content min-h-0 flex-1",
          active === "ask" ? "overflow-hidden" : "overflow-y-auto"
        )}
        id={`tabpanel-${active}`}
        role="tabpanel"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="h-full"
          >
            {active === "alerts" && alerts}
            {active === "why" && why}
            {active === "timeline" && timeline}
            {active === "brief" && brief}
            {active === "ask" && ask}
          </motion.div>
        </AnimatePresence>
      </div>
    </Panel>
  );
}
