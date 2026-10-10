"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { CrewWideEvent } from "@/lib/crewWide";

interface CrewWideBannerProps {
  event: CrewWideEvent | null;
}

export function CrewWideBanner({ event }: CrewWideBannerProps) {
  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          role="status"
          aria-live="polite"
          className="border-b border-bad/30 bg-bad/10 px-3 py-2 sm:px-5"
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-semibold text-bad">
            <span aria-hidden>⚠</span>
            <span>
              Crew-wide: {event.cause.toLowerCase()}{" "}
              {event.alert ? "over limit" : "in watch"}.
            </span>
            <span className="font-normal text-white/70">
              {event.percents.map((p, i) => (
                <span key={i}>
                  {shortName(p.n)} {p.pct}
                  {i < event.percents.length - 1 ? " · " : ""}
                </span>
              ))}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function shortName(n: string): string {
  // "Cdr. Rafi Hassan" -> "Rafi"
  const cleaned = n.replace(/^(Cdr\.|Dr\.|Eng\.)\s+/, "");
  const parts = cleaned.split(/\s+/);
  return parts[0] ?? cleaned;
}
