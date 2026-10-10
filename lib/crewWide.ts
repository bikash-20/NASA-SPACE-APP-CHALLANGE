import type { Crew, FactorName, Level } from "./types";

export interface CrewWideEvent {
  cause: FactorName;
  /** True if every crew member is in level >= 1 (Watch) for this cause. */
  watch: boolean;
  /** True if every crew member is in level >= 2 (Alert) for this cause. */
  alert: boolean;
  /** Per-crew percentage label (e.g. for radiation: % of 250 mSv limit). */
  percents: { n: string; pct: string }[];
}

/**
 * Detect crew-wide events: a single cause (rule index) where all crew are
 * simultaneously at Watch (1) or Alert (2). When the same cause is Alert
 * for all three, the caller can show a banner like
 *   "Crew-wide: radiation over limit (Rafi 120%, Amara 118%, Lin 121%)".
 */
export function findCrewWideEvents(crew: Crew[]): CrewWideEvent | null {
  if (crew.length < 2) return null;
  const ruleCount = crew[0].r.length;
  for (let j = 0; j < ruleCount; j++) {
    const lv = Math.max(...crew.map((c) => c.r[j] as number)) as Level;
    if (lv === 0) continue;
    const allWatch = crew.every((c) => c.r[j] >= 1);
    const allAlert = crew.every((c) => c.r[j] >= 2);
    if (!allWatch) continue;
    const n = crew[0].R[j].n;
    return {
      cause: n,
      watch: allWatch && !allAlert,
      alert: allAlert,
      percents: crew.map((c) => ({
        n: c.n,
        pct: percentFor(j, c),
      })),
    };
  }
  return null;
}

function percentFor(j: number, c: Crew): string {
  // Use the same thresholds as the rules to produce a comparable "percent" label.
  switch (j) {
    case 0: { // heart rate
      return `${Math.round(c.hr)} bpm`;
    }
    case 1: { // oxygen
      return `${c.spo2.toFixed(1)}%`;
    }
    case 2: { // sleep
      return `${c.sleep.toFixed(1)} h`;
    }
    case 3: { // stress
      return `${Math.round(c.stress)}`;
    }
    case 4: { // radiation: percent of the 250 mSv 30-day limit
      return `${Math.round((c.dose / 250) * 100)}%`;
    }
    default:
      return c.R[j]?.val ?? "—";
  }
}
