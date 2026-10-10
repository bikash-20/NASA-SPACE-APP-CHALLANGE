"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Panel, PanelTitle } from "./ui/Panel";
import { colorForLevel } from "@/lib/colors";
import { LEVEL_NAMES } from "@/lib/types";
import { mergeAlerts, type MergedAlert } from "@/lib/alertMerge";
import type { Alert, Crew } from "@/lib/types";

interface AlertsCardProps {
  alerts: Alert[];
  crew: Crew[];
  selected: string | null;
  onSelect: (key: string | null) => void;
}

export function AlertsCard({
  alerts,
  crew,
  selected,
  onSelect,
}: AlertsCardProps) {
  const merged = useMemo(() => mergeAlerts(alerts, crew), [alerts, crew]);
  const active = merged.filter((g) => g.active);
  const cleared = merged.filter((g) => !g.active);
  const [showCleared, setShowCleared] = useState(false);

  return (
    <Panel>
      <PanelTitle
        title="Alerts"
        tone="ok"
        hint={
          active.length > 0
            ? `${active.length} active`
            : alerts.length > 0
            ? `${cleared.length} cleared`
            : "no alerts"
        }
      />
      {merged.length === 0 ? (
        <p className="text-sm text-white/65">
          No alerts yet. Inject a problem above and watch one fire.
        </p>
      ) : (
        <>
          <AlertList
            items={active}
            selected={selected}
            onSelect={onSelect}
          />
          {cleared.length > 0 && (
            <div className="mt-3 border-t border-white/5 pt-3">
              <button
                type="button"
                onClick={() => setShowCleared((v) => !v)}
                className="tappable inline-flex items-center gap-1.5 text-sm font-medium text-white/65 hover:text-ink"
                aria-expanded={showCleared}
              >
                <span aria-hidden>{showCleared ? "▾" : "▸"}</span>
                Last {Math.min(5, cleared.length)} cleared
              </button>
              <AnimatePresence initial={false}>
                {showCleared && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2">
                      <AlertList
                        items={cleared.slice(0, 5)}
                        selected={selected}
                        onSelect={onSelect}
                        dim
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

function AlertList({
  items,
  selected,
  onSelect,
  dim,
}: {
  items: MergedAlert[];
  selected: string | null;
  onSelect: (k: string | null) => void;
  dim?: boolean;
}) {
  return (
    <ul className="space-y-1.5">
      {items.map((g) => {
        const isSel = selected === g.key;
        return (
          <li key={g.key}>
            <button
              onClick={() => onSelect(isSel ? null : g.key)}
              className={`block w-full rounded-lg border bg-white/[0.02] p-2.5 text-left transition-colors ${
                isSel ? "bg-white/[0.09]" : "hover:bg-white/[0.05]"
              } ${dim ? "opacity-70" : ""}`}
              style={{ borderLeft: `4px solid ${colorForLevel(g.lv)}` }}
              aria-pressed={isSel}
            >
              <div className="flex items-baseline justify-between gap-2">
                <b className="text-sm font-semibold text-ink">
                  {g.n}: {g.why}
                </b>
                {g.count > 1 && (
                  <span
                    className="shrink-0 rounded-full bg-white/10 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-white"
                    title={`${g.count} firings`}
                  >
                    ×{g.count}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-white/65">
                <span className="font-mono tabular-nums">{g.val}</span>
                <span aria-hidden>·</span>
                <span style={{ color: colorForLevel(g.lv) }} className="font-semibold">
                  {LEVEL_NAMES[g.lv]}
                </span>
                <span aria-hidden>·</span>
                <span className="font-mono tabular-nums">{g.lastT}</span>
                {g.firstT !== g.lastT && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="text-white/55">
                      first seen {g.firstT}
                    </span>
                  </>
                )}
                <span aria-hidden>·</span>
                <span className={g.active ? "text-ok" : "text-white/55"}>
                  {g.active ? "active" : "cleared"}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
