"use client";

import { Button } from "./ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

interface ScenarioBarProps {
  storm: boolean;
  aiOn: boolean;
  selectedFlags: { sleep: 0 | 1; card: 0 | 1 };
  onToggle: (k: "storm" | "ai" | "sleep" | "card") => void;
  onDemo: () => void;
  onReset: () => void;
  caption: string;
  /** Visible only at >=lg. Mobile uses the sheet. */
  variant?: "inline" | "compact";
}

export function ScenarioBar({
  storm,
  aiOn,
  selectedFlags,
  onToggle,
  onDemo,
  onReset,
  caption,
  variant = "inline",
}: ScenarioBarProps) {
  if (variant === "compact") {
    // Mobile sheet / inline pill row
    return (
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 sm:px-5">
        <Button variant="primary" size="sm" onClick={onDemo}>
          Run guided demo
        </Button>
        <Button
          variant={storm ? "danger" : "default"}
          size="sm"
          onClick={() => onToggle("storm")}
        >
          {storm ? "Storm on" : "Solar storm"}
        </Button>
        <Button
          variant={selectedFlags.sleep ? "danger" : "default"}
          size="sm"
          onClick={() => onToggle("sleep")}
        >
          {selectedFlags.sleep ? "Sleep on" : "Sleep debt"}
        </Button>
        <Button
          variant={selectedFlags.card ? "danger" : "default"}
          size="sm"
          onClick={() => onToggle("card")}
        >
          {selectedFlags.card ? "Cardiac on" : "Cardiac strain"}
        </Button>
        <Button
          variant={!aiOn ? "danger" : "default"}
          size="sm"
          onClick={() => onToggle("ai")}
        >
          {aiOn ? "AI on" : "AI offline"}
        </Button>
        <Button size="sm" onClick={onReset} variant="ghost" className="text-white/70">
          Reset
        </Button>
        <AnimatePresence mode="wait">
          {caption && (
            <motion.p
              key={caption}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={cn(
                "basis-full text-sm font-medium text-accent",
                variant === "compact" ? "" : ""
              )}
            >
              {caption}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Inline (desktop) — used inside the top row
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 hidden text-sm text-white/55 xl:inline">Inject:</span>
      <Button
        variant={storm ? "danger" : "default"}
        size="sm"
        onClick={() => onToggle("storm")}
      >
        Solar storm
      </Button>
      <Button
        variant={selectedFlags.sleep ? "danger" : "default"}
        size="sm"
        onClick={() => onToggle("sleep")}
      >
        Sleep debt
      </Button>
      <Button
        variant={selectedFlags.card ? "danger" : "default"}
        size="sm"
        onClick={() => onToggle("card")}
      >
        Cardiac strain
      </Button>
      <Button
        variant={!aiOn ? "danger" : "default"}
        size="sm"
        onClick={() => onToggle("ai")}
      >
        {aiOn ? "AI on" : "AI offline"}
      </Button>
    </div>
  );
}
