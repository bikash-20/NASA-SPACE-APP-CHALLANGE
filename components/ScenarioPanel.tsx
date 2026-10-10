"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Panel, PanelTitle } from "./ui/Panel";
import { Button } from "./ui/Button";
import { cn } from "@/lib/cn";
import type { Crew } from "@/lib/types";

type Flag = "storm" | "ai" | "sleep" | "card";

interface ScenarioPanelProps {
  /** "inline" = permanent card in the right rail (>=lg). "sheet" = mobile/tablet bottom sheet. */
  variant: "inline" | "sheet";
  open?: boolean;
  onClose?: () => void;
  storm: boolean;
  aiOn: boolean;
  selectedFlags: { sleep: 0 | 1; card: 0 | 1 };
  selected: Crew;
  onToggle: (k: Flag) => void;
  onDemo: () => void;
  onReset: () => void;
}

export function ScenarioPanel({
  variant,
  open,
  onClose,
  storm,
  aiOn,
  selectedFlags,
  selected,
  onToggle,
  onDemo,
  onReset,
}: ScenarioPanelProps) {
  if (variant === "inline") {
    return (
      <Panel density="compact" tone="default">
        <PanelTitle title="Inject a problem" />
        <div className="space-y-1.5">
          <ScenarioRow
            active={storm}
            onClick={() => onToggle("storm")}
            label="Solar storm"
            target="all crew"
            pillTone="bad"
          />
          <ScenarioRow
            active={!!selectedFlags.sleep}
            onClick={() => onToggle("sleep")}
            label="Sleep debt"
            target={crewShortName(selected.n)}
            pillTone="bad"
          />
          <ScenarioRow
            active={!!selectedFlags.card}
            onClick={() => onToggle("card")}
            label="Cardiac strain"
            target={crewShortName(selected.n)}
            pillTone="bad"
          />
          <ScenarioRow
            active={!aiOn}
            onClick={() => onToggle("ai")}
            label="AI risk scorer"
            target="offline"
            pillTone="bad"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <Button block variant="primary" size="sm" onClick={onDemo}>
            Run guided demo
          </Button>
          <Button size="sm" variant="default" onClick={onReset}>
            Reset
          </Button>
        </div>
      </Panel>
    );
  }

  // Mobile / tablet bottom sheet
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Inject a problem"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border border-white/10 bg-bg-deep p-4 shadow-2xl pb-[env(safe-area-inset-bottom)]"
            style={{ maxHeight: "80dvh" }}
          >
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-white/15" />
            <h2 className="mb-1 text-lg font-semibold text-ink">
              Inject a problem
            </h2>
            <p className="mb-4 text-sm text-white/65">
              Selected crew member is {crewShortName(selected.n)}.
              Toggle a problem to apply it.
            </p>
            <div className="space-y-1.5">
              <ScenarioRow
                active={storm}
                onClick={() => onToggle("storm")}
                label="Solar storm"
                target="all crew"
                pillTone="bad"
              />
              <ScenarioRow
                active={!!selectedFlags.sleep}
                onClick={() => onToggle("sleep")}
                label="Sleep debt"
                target={crewShortName(selected.n)}
                pillTone="bad"
              />
              <ScenarioRow
                active={!!selectedFlags.card}
                onClick={() => onToggle("card")}
                label="Cardiac strain"
                target={crewShortName(selected.n)}
                pillTone="bad"
              />
              <ScenarioRow
                active={!aiOn}
                onClick={() => onToggle("ai")}
                label="AI risk scorer"
                target={!aiOn ? "offline" : "on"}
                pillTone="bad"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <Button block onClick={onDemo} variant="primary">
                Run guided demo
              </Button>
              <Button onClick={onReset} variant="default">
                Reset
              </Button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="tappable mt-3 block w-full rounded-md py-2 text-center text-sm text-white/65 hover:text-ink"
            >
              Close
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Compact, two-line row. Top: label + active "On" pill. Bottom: target. */
function ScenarioRow({
  active,
  onClick,
  label,
  target,
  pillTone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  target: string;
  pillTone: "bad";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "tappable flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
        active
          ? "border-bad/45 bg-bad/10"
          : "border-white/10 bg-white/[0.025] hover:bg-white/[0.06]"
      )}
    >
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "text-base font-semibold",
              active ? "text-bad" : "text-ink"
            )}
          >
            {label}
          </span>
          {active && (
            <span
              className="rounded-full bg-bad px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-white"
              style={{ letterSpacing: "0.04em" }}
            >
              On
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-sm text-white/65">{target}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "ml-2 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          active ? "bg-bad" : "bg-white/15"
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
            active ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}

/** "Dr. Lin Zhao" -> "Dr. Lin Zhao" (kept full for clarity). Used as target text. */
function crewShortName(n: string): string {
  return n;
}
