import type { Alert, Crew } from "./types";

export interface MergedAlert {
  /** Stable id for the group (the first alert's id). */
  key: string;
  i: 0 | 1 | 2;
  j: number;
  n: Alert["n"];
  /** The latest reading. */
  val: string;
  /** The most recent level. */
  lv: Alert["lv"];
  /** The latest "why" string. */
  why: string;
  /** Number of firings represented. */
  count: number;
  /** Timestamp of the first firing. */
  firstT: string;
  /** Timestamp of the latest firing. */
  lastT: string;
  /** Most recent AI score at firing time. */
  ai: number;
  aiOn: boolean;
  /** Whether the rule is still in alarm right now. */
  active: boolean;
  /** The original list of alerts. */
  raw: Alert[];
}

/**
 * Group consecutive alerts with the same (i, j) into a single row.
 * Active rows sort first; within each group, newest first.
 *
 * "Active" is computed against the *current* crew state — a rule that
 * is still in alarm right now is active even if the original alert was
 * fired several ticks ago.
 */
export function mergeAlerts(alerts: Alert[], crew: Crew[]): MergedAlert[] {
  const groups = new Map<string, MergedAlert>();
  for (const a of alerts) {
    const k = `${a.i}-${a.j}`;
    const g = groups.get(k);
    if (!g) {
      groups.set(k, {
        key: k,
        i: a.i,
        j: a.j,
        n: a.n,
        val: a.th, // filled below from latest rule row
        lv: a.lv,
        why: a.why,
        count: 1,
        firstT: a.t,
        lastT: a.t,
        ai: a.ai,
        aiOn: a.aiOn,
        active: crew[a.i].r[a.j] >= a.lv,
        raw: [a],
      });
    } else {
      g.count += 1;
      g.lastT = a.t;
      g.lv = a.lv;
      g.why = a.why;
      g.ai = a.ai;
      g.active = crew[a.i].r[a.j] >= a.lv;
      g.raw.push(a);
    }
  }
  // Update val from current rule value
  for (const g of groups.values()) {
    g.val = crew[g.i].R[g.j]?.val ?? g.why;
  }
  // Sort: active first, then by most recent timestamp
  return [...groups.values()].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.lastT < b.lastT ? 1 : a.lastT > b.lastT ? -1 : 0;
  });
}
