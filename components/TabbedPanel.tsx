"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Panel } from "./ui/Panel";
import { cn } from "@/lib/cn";

export type TabKey = "alerts" | "why" | "brief";

interface TabbedPanelProps {
  active: TabKey;
  onChange: (k: TabKey) => void;
  alerts: React.ReactNode;
  why: React.ReactNode;
  brief: React.ReactNode;
  alertsBadge?: number;
}

const TABS: { id: TabKey; label: string }[] = [
  { id: "alerts", label: "Alerts" },
  { id: "why", label: "Why" },
  { id: "brief", label: "Brief & ask" },
];

export function TabbedPanel({
  active,
  onChange,
  alerts,
  why,
  brief,
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
                "tappable relative px-3 py-2 text-sm font-medium",
                isOn ? "text-ink" : "text-white/65 hover:text-ink"
              )}
            >
              {t.label}
              {t.id === "alerts" && alertsBadge && alertsBadge > 0 ? (
                <span className="ml-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-bad px-1 text-[0.625rem] font-semibold text-white">
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
      <div className="min-h-0 flex-1 overflow-y-auto" id={`tabpanel-${active}`} role="tabpanel">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {active === "alerts" && alerts}
            {active === "why" && why}
            {active === "brief" && brief}
          </motion.div>
        </AnimatePresence>
      </div>
    </Panel>
  );
}
