import type { Alert, Crew } from "./types";
import { aiScore } from "./aiScore";
import { evalRules } from "./rules";

const NAMES = ["Cdr. Amara Okafor", "Dr. Lin Zhao", "Eng. Rafi Ahmed"];
const ROLES = ["Commander", "Flight surgeon", "Engineer"];
const BH = [58, 64, 70];
const D0 = [165, 158, 171];

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const DEFAULT_SIMULATION_SEED = 112060;

function randomFrom(seed: number): {
  random: () => number;
  seed: () => number;
} {
  let current = seed >>> 0;
  return {
    random: () => {
      current = (1664525 * current + 1013904223) >>> 0;
      return current / 0x100000000;
    },
    seed: () => current,
  };
}

const between = (random: () => number, a: number, b: number) =>
  a + random() * (b - a);

export function mkCrew(i: 0 | 1 | 2): Crew {
  return {
    id: i,
    n: NAMES[i],
    role: ROLES[i],
    bhr: BH[i],
    hr: BH[i],
    spo2: 98,
    sleep: 7.2,
    stress: 28,
    dose: D0[i],
    rate: 0.04,
    H: { hr: [], spo2: [], stress: [], rate: [], dose: [], sleep: [], ai: [] },
    r: [0, 0, 0, 0, 0],
    armed: [true, true, true, true, true],
    ai: 0,
    F: [],
    R: [],
    f: { sleep: 0, card: 0 },
  };
}

/** Mission clock. Starts at Day 112, 06:00. */
export function clock(tick: number): string {
  const m = tick * 30 + 360;
  const h = Math.floor((m % 1440) / 60);
  const mi = m % 60;
  return (
    "Day " +
    (112 + Math.floor(m / 1440)) +
    " · " +
    String(h).padStart(2, "0") +
    ":" +
    String(mi).padStart(2, "0")
  );
}

export interface StepOpts {
  storm: boolean;
  aiOn: boolean;
  emitAlerts: boolean;
  tick: number;
}

export interface StepResult {
  crew: Crew[];
  alerts: Alert[];
  seed: number;
}

/** Advance one tick for the whole crew without mutating the provided snapshot. */
export function step(
  crew: Crew[],
  opts: StepOpts,
  seed = DEFAULT_SIMULATION_SEED
): StepResult {
  const { storm, aiOn, emitAlerts, tick } = opts;
  const rng = randomFrom(seed);
  const alerts: Alert[] = [];

  const nextCrew = crew.map((previous, i) => {
    const f = previous.f;
    const c: Crew = {
      ...previous,
      H: {
        hr: [...previous.H.hr],
        spo2: [...previous.H.spo2],
        stress: [...previous.H.stress],
        rate: [...previous.H.rate],
        dose: [...previous.H.dose],
        sleep: [...previous.H.sleep],
        ai: [...previous.H.ai],
      },
      r: [...previous.r],
      armed: [...previous.armed],
      F: [...previous.F],
      R: [...previous.R],
    };
    c.stress = cl(
      c.stress +
        (28 +
          f.sleep * 34 +
          f.card * 28 +
          (storm ? 18 : 0) -
          c.stress) *
          0.12 +
        between(rng.random, -2, 2),
      0,
      100
    );
    c.hr +=
      (c.bhr * (1 + 0.6 * f.card) + (c.stress - 30) * 0.12 - c.hr) * 0.25 +
      between(rng.random, -1.2, 1.2);
    c.spo2 = Math.min(
      100,
      c.spo2 + ((f.card ? 93.2 : 98) - c.spo2) * 0.2 +
        between(rng.random, -0.3, 0.3)
    );
    c.sleep +=
      ((f.sleep ? 3.8 : 7.2) - c.sleep) * 0.07 +
      between(rng.random, -0.03, 0.03);
    c.rate = storm
      ? 3 + between(rng.random, -0.4, 0.6)
      : 0.04 + between(rng.random, 0, 0.02);
    c.dose += c.rate * 0.5;
    c.H.hr.push(c.hr);
    c.H.spo2.push(c.spo2);
    c.H.stress.push(c.stress);
    c.H.rate.push(c.rate);
    c.H.dose.push(c.dose);
    c.H.sleep.push(c.sleep);

    aiScore(c);
    c.H.ai.push(c.ai);
    for (const values of Object.values(c.H)) {
      if (values.length > 60) values.shift();
    }

    const rules = evalRules(c);
    rules.forEach((x, j) => {
      // Hysteresis: re-arm when the level drops back to 0 so the next
      // crossing can fire. While the level stays >0, suppress repeats.
      if (x.lv === 0) c.armed[j] = true;
      const risingOrSteppingUp = x.lv > c.r[j];
      const fresh = x.lv > 0 && c.armed[j];
      if (emitAlerts && (risingOrSteppingUp || fresh)) {
        alerts.push({
          id: `${tick}-${i}-${j}`,
          t: clock(tick),
          i: i as 0 | 1 | 2,
          j,
          n: x.n,
          th: x.th,
          lv: x.lv,
          why: x.why,
          ai: Math.round(c.ai),
          aiOn,
        });
        c.armed[j] = false;
      }
      c.r[j] = x.lv;
    });
    c.R = rules;
    return c;
  });

  return { crew: nextCrew, alerts, seed: rng.seed() };
}
