import { describe, it, expect } from "vitest";
import { mkCrew, step, clock, DEFAULT_SIMULATION_SEED } from "./simulation";

describe("mkCrew", () => {
  it("returns a stable baseline for a healthy crew", () => {
    const c = mkCrew(0);
    expect(c.bhr).toBeGreaterThan(0);
    expect(c.hr).toBe(c.bhr);
    expect(c.spo2).toBeCloseTo(98, 1);
    expect(c.sleep).toBeGreaterThan(5);
    expect(c.stress).toBeLessThan(50);
    expect(c.r).toEqual([0, 0, 0, 0, 0]);
    expect(c.armed).toEqual([true, true, true, true, true]);
  });

  it("produces three distinct crew members with different baselines", () => {
    const crew = [mkCrew(0), mkCrew(1), mkCrew(2)];
    const names = new Set(crew.map((c) => c.n));
    const roles = new Set(crew.map((c) => c.role));
    expect(names.size).toBe(3);
    expect(roles.size).toBe(3);
  });
});

describe("step (NASA repo — uses makeInitialState() in app/page.tsx)", () => {
  it("seeded step is deterministic across runs for the same input", () => {
    // The Node --test runner (tests/simulation.test.cjs) already covers
    // the full makeInitialState() flow. Here we just sanity-check the
    // step() function's determinism contract on a hand-built crew.
    const crew = [mkCrew(0)];
    const opts = { storm: false, aiOn: true, emitAlerts: false, tick: 0 } as const;
    const a = step(crew, opts, DEFAULT_SIMULATION_SEED);
    const b = step(crew, opts, DEFAULT_SIMULATION_SEED);
    expect(a.seed).toBe(b.seed);
    expect(a.crew[0].hr).toBe(b.crew[0].hr);
  });
});

describe("step", () => {
  it("does not mutate the input crew array", () => {
    const crew = [mkCrew(0), mkCrew(1), mkCrew(2)];
    const before = JSON.stringify(crew);
    step(crew, {
      storm: false,
      aiOn: true,
      emitAlerts: false,
      tick: 0,
    });
    expect(JSON.stringify(crew)).toBe(before);
  });

  it("returns fresh crew state and a deterministic next seed for the same input", () => {
    const crew = [mkCrew(0), mkCrew(1), mkCrew(2)];
    const opts = {
      storm: false,
      aiOn: true,
      emitAlerts: false,
      tick: 0,
    } as const;

    const a = step(crew, opts, DEFAULT_SIMULATION_SEED);
    const b = step(crew, opts, DEFAULT_SIMULATION_SEED);

    // Same seed + same input → same output and same next seed
    expect(a.seed).toBe(b.seed);
    expect(a.crew[0].hr).toBe(b.crew[0].hr);
    expect(a.crew[0].spo2).toBe(b.crew[0].spo2);
  });

  it("caps history arrays at 60 samples", () => {
    let crew = [mkCrew(0)];
    for (let i = 0; i < 200; i++) {
      const r = step(crew, {
        storm: false,
        aiOn: true,
        emitAlerts: false,
        tick: i,
      });
      crew = r.crew;
    }
    expect(crew[0].H.hr.length).toBeLessThanOrEqual(60);
    expect(crew[0].H.spo2.length).toBeLessThanOrEqual(60);
  });

  it("also caps the new dose, sleep, and AI history arrays at 60", () => {
    let crew = [mkCrew(0)];
    for (let i = 0; i < 200; i++) {
      const r = step(crew, {
        storm: false,
        aiOn: true,
        emitAlerts: false,
        tick: i,
      });
      crew = r.crew;
    }
    expect(crew[0].H.dose.length).toBeLessThanOrEqual(60);
    expect(crew[0].H.sleep.length).toBeLessThanOrEqual(60);
    expect(crew[0].H.ai.length).toBeLessThanOrEqual(60);
  });

  it("dose history is monotonically non-decreasing", () => {
    let crew = [mkCrew(0)];
    for (let i = 0; i < 30; i++) {
      const r = step(crew, {
        storm: false,
        aiOn: true,
        emitAlerts: false,
        tick: i,
      });
      crew = r.crew;
    }
    const d = crew[0].H.dose;
    for (let i = 1; i < d.length; i += 1) {
      expect(d[i]).toBeGreaterThanOrEqual(d[i - 1]);
    }
  });
});

describe("clock", () => {
  it("starts at Day 112, 06:00 at tick 0", () => {
    expect(clock(0)).toBe("Day 112 · 06:00");
  });

  it("advances 30 minutes per tick", () => {
    // 2 ticks = 1 hour → 07:00
    expect(clock(2)).toBe("Day 112 · 07:00");
    // 48 ticks = 24h → Day 113, 06:00
    expect(clock(48)).toBe("Day 113 · 06:00");
  });
});
