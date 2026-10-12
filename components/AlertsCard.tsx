"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Panel, PanelTitle } from "./ui/Panel";
import { colorForLevel } from "@/lib/colors";
import { LEVEL_NAMES } from "@/lib/types";
import { mergeAlerts, type MergedAlert } from "@/lib/alertMerge";
import type { Alert, Crew } from "@/lib/types";

/** Strip the rank prefix and return the given name ("Cdr. Amara Okafor" -> "Amara"). */
function shortName(n: string): string {
  const cleaned = n.replace(/^(Cdr\.|Dr\.|Eng\.)\s+/, "");
  return cleaned.split(/\s+/)[0] ?? cleaned;
}

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

  // Build lookup tables so every alert row can show "Amara · Commander".
  const crewNames = useMemo(
    () =>
      Object.fromEntries(crew.map((c) => [c.id, c.n])) as Record<number, string>,
    [crew]
  );
  const crewRoles = useMemo(
    () =>
      Object.fromEntries(crew.map((c) => [c.id, c.role])) as Record<
        number,
        string
      >,
    [crew]
  );

  return (
    <Panel className="desktop-alert-card">
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
            crewNames={crewNames}
            crewRoles={crewRoles}
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
                        crewNames={crewNames}
                        crewRoles={crewRoles}
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
  crewNames,
  crewRoles,
}: {
  items: MergedAlert[];
  selected: string | null;
  onSelect: (k: string | null) => void;
  dim?: boolean;
  /** Full name per crew index, used to label each alert with the crew member it concerns. */
  crewNames: Record<number, string>;
  /** Role per crew index, used as a secondary label ("Amara · Commander"). */
  crewRoles: Record<number, string>;
}) {
  return (
    <ul className="space-y-1.5">
      {items.map((g) => {
        const isSel = selected === g.key;
        const crewFull = crewNames[g.i] ?? `Crew ${g.i + 1}`;
        const crewRole = crewRoles[g.i] ?? "";
        const crewShort = shortName(crewFull);
        return (
          <li key={g.key}>
            <button
              onClick={() => onSelect(isSel ? null : g.key)}
              className={`block w-full rounded-lg border bg-white/[0.02] p-2.5 text-left transition-colors ${
                isSel ? "bg-white/[0.09]" : "hover:bg-white/[0.05]"
              } ${dim ? "opacity-70" : ""}`}
              style={{ borderLeft: `4px solid ${colorForLevel(g.lv)}` }}
              aria-pressed={isSel}
              aria-label={`${crewFull} — ${g.n}: ${g.why}`}
            >
              <div className="desktop-alert-crew flex items-center gap-2">
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[0.6875rem] font-bold uppercase tracking-wider text-ink"
                  title={crewFull}
                >
                  {crewShort.charAt(0)}
                </span>
                <span className="min-w-0 truncate text-sm font-semibold text-accent">
                  {crewShort}
                  {crewRole && (
                    <span className="ml-1 text-sm font-normal text-white/55">
                      · {crewRole}
                    </span>
                  )}
                </span>
                {g.count > 1 && (
                  <span
                    className="ml-auto shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-white"
                    title={`${g.count} firings`}
                  >
                    ×{g.count}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <b className="desktop-alert-title hidden text-sm font-semibold text-ink lg:block">
                  {crewShort}: {g.n}: {g.why}
                </b>
                <b className="text-sm font-semibold text-ink lg:hidden">
                  {g.n}: {g.why}
                </b>
              </div>
              <div className="desktop-alert-meta mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-white/65">
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
