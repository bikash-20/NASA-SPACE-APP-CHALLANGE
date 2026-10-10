"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/Button";

interface ScenarioSheetProps {
  open: boolean;
  onClose: () => void;
  storm: boolean;
  aiOn: boolean;
  selectedFlags: { sleep: 0 | 1; card: 0 | 1 };
  onToggle: (k: "storm" | "ai" | "sleep" | "card") => void;
  onDemo: () => void;
  onReset: () => void;
}

export function ScenarioSheet({
  open,
  onClose,
  storm,
  aiOn,
  selectedFlags,
  onToggle,
  onDemo,
  onReset,
}: ScenarioSheetProps) {
  useEffect(() => {
    if (!open) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, [open]);

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
            <h2 className="mb-3 text-lg font-semibold text-ink">
              Inject a problem
            </h2>
            <p className="mb-4 text-sm text-white/65">
              Toggles apply to the selected crew member unless noted.
            </p>
            <div className="grid grid-cols-1 gap-2">
              <SheetButton
                active={storm}
                onClick={() => onToggle("storm")}
                label="Solar storm"
                hint="Affects all crew"
              />
              <SheetButton
                active={!!selectedFlags.sleep}
                onClick={() => onToggle("sleep")}
                label="Sleep debt"
                hint="Selected crew member"
              />
              <SheetButton
                active={!!selectedFlags.card}
                onClick={() => onToggle("card")}
                label="Cardiac strain"
                hint="Selected crew member"
              />
              <SheetButton
                active={!aiOn}
                onClick={() => onToggle("ai")}
                label={aiOn ? "AI on" : "AI offline"}
                hint="Toggle the AI risk scorer"
              />
            </div>
            <div className="mt-5 flex gap-2">
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

function SheetButton({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`tappable flex w-full items-center justify-between gap-2 rounded-lg border px-3 text-left transition-colors ${
        active
          ? "border-bad/40 bg-bad/10 text-bad"
          : "border-white/10 bg-white/[0.03] text-ink hover:bg-white/[0.06]"
      }`}
    >
      <span className="text-base font-semibold">{label}</span>
      <span className="text-sm text-white/55">{hint}</span>
      <span
        aria-hidden
        className={`ml-2 inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          active ? "bg-bad" : "bg-white/15"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            active ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
