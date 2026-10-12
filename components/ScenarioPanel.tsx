"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Panel, PanelTitle } from "./ui/Panel";
import { Button } from "./ui/Button";
import { cn } from "@/lib/cn";
import type { Crew } from "@/lib/types";

type Flag = "storm" | "ai" | "sleep" | "card";
type Preset = "cardiac" | "sleep" | "storm";

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
  activePreset: Preset | "guided-demo" | null;
  onPreset: (scenario: Preset) => void;
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
  activePreset,
  onPreset,
  onDemo,
  onReset,
}: ScenarioPanelProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (variant !== "sheet" || !open) return;
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [variant, open]);

  if (variant === "inline") {
    return (
      <Panel density="compact" tone="default" className="desktop-scenarios">
        <PanelTitle title="Inject a problem" />
        <div className="space-y-1.5 desktop-scenario-rows">
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
            target={!aiOn ? "offline" : "online"}
            pillTone="bad"
          />
        </div>
        <div className="mt-2 flex justify-end">
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
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="scenario-sheet-title"
            tabIndex={-1}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-50 overflow-y-auto rounded-t-3xl border border-white/10 bg-bg-deep p-4 pb-[env(safe-area-inset-bottom)] shadow-2xl"
            style={{ maxHeight: "80dvh" }}
          >
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-white/15" />
            <h2 className="mb-1 text-lg font-semibold text-ink">
              <span id="scenario-sheet-title">Inject a problem</span>
            </h2>
            <p className="mb-4 text-sm text-white/65">
              Selected crew member is {crewShortName(selected.n)}.
              Toggle a problem to apply it.
            </p>
            <PresetButtons activePreset={activePreset} onPreset={onPreset} />
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

function PresetButtons({
  compact = false,
  activePreset,
  onPreset,
}: {
  compact?: boolean;
  activePreset: Preset | "guided-demo" | null;
  onPreset: (scenario: Preset) => void;
}) {
  const presets: { id: Preset; label: string; description: string }[] = [
    { id: "cardiac", label: "Cardiac strain", description: "One crew member" },
    { id: "sleep", label: "Sleep debt", description: "One crew member" },
    { id: "storm", label: "Solar storm", description: "Whole crew" },
  ];

  return (
    <div
      className={`mb-3 grid gap-1.5 ${
        compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-3"
      }`}
    >
      {presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onPreset(preset.id)}
          aria-pressed={activePreset === preset.id}
          className={cn(
            "tappable rounded-lg border px-2 py-1.5 text-left transition-colors",
            activePreset === preset.id
              ? "border-accent/60 bg-accent/10"
              : "border-white/10 bg-white/[0.025] hover:bg-white/[0.06]"
          )}
        >
          <span className="block text-sm font-semibold text-ink">
            {preset.label}
          </span>
          <span className="block text-xs text-white/60">
            {preset.description}
          </span>
        </button>
      ))}
    </div>
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

/** "Cdr. Amara Okafor" -> "Amara", "Dr. Lin Zhao" -> "Lin", "Eng. Rafi Ahmed" -> "Rafi". */
function crewShortName(n: string): string {
  const cleaned = n.replace(/^(Cdr\.|Dr\.|Eng\.)\s+/, "");
  return cleaned.split(/\s+/)[0] ?? cleaned;
}
