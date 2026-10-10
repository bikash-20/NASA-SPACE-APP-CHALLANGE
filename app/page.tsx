"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Pipeline } from "@/components/Pipeline";
import { ScenarioBar } from "@/components/ScenarioBar";
import { CrewList } from "@/components/CrewList";
import { VitalsCard } from "@/components/VitalsCard";
import { AIScoreCard } from "@/components/AIScoreCard";
import { RulesCard } from "@/components/RulesCard";
import { AlertsCard } from "@/components/AlertsCard";
import { TraceCard } from "@/components/TraceCard";
import { BriefCard } from "@/components/BriefCard";
import { mkCrew, clock as tickClock, step as stepSim, type StepOpts } from "@/lib/simulation";
import type { Alert, ChatMessage, Crew } from "@/lib/types";

const CAP0 =
  'Press "Run guided demo" to walk the whole flow, or inject problems yourself.';

type DemoStep = { at: number; msg: string; fn: () => void };

interface State {
  crew: Crew[];
  selected: 0 | 1 | 2;
  storm: boolean;
  aiOn: boolean;
  running: boolean;
  speed: 1 | 2 | 4;
  tick: number;
  alerts: Alert[];
  selectedAlert: string | null;
  brief: string | null;
  briefModel: string | null;
  briefLoading: boolean;
  chat: ChatMessage[];
  chatStreaming: boolean;
  chatModel: string | null;
  caption: string;
  pipelineValues: string[];
}

type Action =
  | { type: "TICK" }
  | { type: "TOGGLE_RUN" }
  | { type: "SET_SPEED"; speed: 1 | 2 | 4 }
  | { type: "SELECT_CREW"; i: 0 | 1 | 2 }
  | { type: "TOG_FLAG"; k: "storm" | "ai" | "sleep" | "card" }
  | { type: "ADD_ALERT"; a: Alert }
  | { type: "SELECT_ALERT"; id: string | null }
  | { type: "SET_BRIEF"; text: string; model: string }
  | { type: "SET_BRIEF_LOADING"; v: boolean }
  | { type: "ADD_CHAT_USER"; content: string }
  | { type: "ADD_CHAT_DELTA"; content: string; model: string }
  | { type: "FINALIZE_CHAT"; model: string }
  | { type: "SET_CHAT_STREAMING"; v: boolean }
  | { type: "RESET" }
  | { type: "DEMO_SET"; demo: DemoStep[] | null }
  | { type: "DEMO_FIRE" }
  | { type: "SET_CAPTION"; v: string };

const initial: State = {
  crew: [0, 1, 2].map((i) => mkCrew(i as 0 | 1 | 2)),
  selected: 0,
  storm: false,
  aiOn: true,
  running: true,
  speed: 1,
  tick: 0,
  alerts: [],
  selectedAlert: null,
  brief: null,
  briefModel: null,
  briefLoading: false,
  chat: [],
  chatStreaming: false,
  chatModel: null,
  caption: CAP0,
  pipelineValues: ["", "", "", "", "", ""],
};

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "TICK": {
      const next: State = { ...s, tick: s.tick + 1 };
      // update pipeline values
      const c = next.crew[next.selected];
      const mx = next.crew.reduce(
        (m, x) => Math.max(m, ...x.r),
        0
      );
      const active = next.alerts.filter(
        (al) => next.crew[al.i].r[al.j] >= al.lv
      ).length;
      next.pipelineValues = [
        `t+${next.tick}`,
        `HR/SpO₂ ${Math.round(c.hr)}/${c.spo2.toFixed(0)}`,
        next.aiOn ? `${Math.round(c.ai)}/100` : "offline",
        `${mx === 0 ? "0" : mx === 1 ? "watch" : "alert"}`,
        `${active} active`,
        s.brief ? "ready" : "—",
      ];
      return next;
    }
    case "TOGGLE_RUN":
      return { ...s, running: !s.running };
    case "SET_SPEED":
      return { ...s, speed: a.speed };
    case "SELECT_CREW":
      return { ...s, selected: a.i, selectedAlert: null };
    case "TOG_FLAG":
      if (a.k === "storm") return { ...s, storm: !s.storm };
      if (a.k === "ai") return { ...s, aiOn: !s.aiOn };
      const f = { ...s.crew[s.selected].f };
      f[a.k] = (f[a.k] ? 0 : 1) as 0 | 1;
      const crew = s.crew.map((c, i) =>
        i === s.selected ? { ...c, f } : c
      );
      return { ...s, crew };
    case "ADD_ALERT":
      return { ...s, alerts: [a.a, ...s.alerts] };
    case "SELECT_ALERT":
      return { ...s, selectedAlert: a.id };
    case "SET_BRIEF":
      return { ...s, brief: a.text, briefModel: a.model, briefLoading: false };
    case "SET_BRIEF_LOADING":
      return { ...s, briefLoading: a.v };
    case "ADD_CHAT_USER":
      return { ...s, chat: [...s.chat, { role: "user", content: a.content }] };
    case "ADD_CHAT_DELTA": {
      const last = s.chat[s.chat.length - 1];
      const chat: ChatMessage[] =
        last && last.role === "assistant"
          ? [
              ...s.chat.slice(0, -1),
              { ...last, content: last.content + a.content },
            ]
          : [...s.chat, { role: "assistant" as const, content: a.content }];
      return { ...s, chat, chatModel: a.model };
    }
    case "FINALIZE_CHAT":
      return { ...s, chatModel: a.model, chatStreaming: false };
    case "SET_CHAT_STREAMING":
      return { ...s, chatStreaming: a.v };
    case "SET_CAPTION":
      return { ...s, caption: a.v };
    case "RESET": {
      const crew = [0, 1, 2].map((i) => mkCrew(i as 0 | 1 | 2));
      // pre-roll 60 ticks so charts aren't empty
      for (let i = 0; i < 60; i++) {
        const opts: StepOpts = {
          storm: false,
          aiOn: true,
          emitAlerts: false,
          tick: 0,
        };
        stepSim(crew, opts);
      }
      return {
        ...initial,
        crew,
        caption: CAP0,
        pipelineValues: ["", "", "", "", "", ""],
      };
    }
    case "DEMO_SET":
      // store demo steps in a ref-like outside reducer; not in state
      return s;
    case "DEMO_FIRE":
      return s;
    default:
      return s;
  }
}

export default function Page() {
  const [state, dispatch] = useReducer(reducer, initial, (s) => {
    // pre-roll 60 ticks
    const crew = s.crew;
    for (let i = 0; i < 60; i++) {
      stepSim(crew, {
        storm: false,
        aiOn: true,
        emitAlerts: false,
        tick: 0,
      });
    }
    return s;
  });

  // Demo script (ref to avoid re-render thrash)
  const demoRef = useRef<DemoStep[] | null>(null);
  const tickRef = useRef(state.tick);
  tickRef.current = state.tick;

  // Main simulation tick
  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(() => {
      const t = tickRef.current;
      // fire any demo step that matches this tick
      if (demoRef.current && demoRef.current.length && t >= demoRef.current[0].at) {
        const s = demoRef.current.shift()!;
        s.fn();
        dispatch({ type: "SET_CAPTION", v: s.msg });
      }
      // run sim
      const newAlerts: Alert[] = [];
      stepSim(state.crew, {
        storm: state.storm,
        aiOn: state.aiOn,
        emitAlerts: true,
        tick: t,
        onAlert: (a) => newAlerts.push(a),
      });
      // dispatch tick + alerts
      for (const a of newAlerts) dispatch({ type: "ADD_ALERT", a });
      dispatch({ type: "TICK" });
    }, 1000 / state.speed);
    return () => clearInterval(id);
  }, [state.running, state.speed, state.storm, state.aiOn, state.crew]);

  const writeBrief = useCallback(async () => {
    if (state.briefLoading) return;
    dispatch({ type: "SET_BRIEF_LOADING", v: true });
    try {
      const c = state.crew[state.selected];
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crew: c }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const j = (await res.json()) as { text: string; model: string };
      dispatch({ type: "SET_BRIEF", text: j.text, model: j.model });
    } catch (err) {
      dispatch({
        type: "SET_BRIEF",
        text: `**Brief failed:** ${err instanceof Error ? err.message : String(err)}`,
        model: "—",
      });
    }
  }, [state.briefLoading, state.crew, state.selected]);

  const sendChat = useCallback(
    async (text: string) => {
      dispatch({ type: "ADD_CHAT_USER", content: text });
      dispatch({ type: "SET_CHAT_STREAMING", v: true });
      try {
        const c = state.crew[state.selected];
        const messages = state.chat
          .filter((m) => m.role === "user" || m.role === "assistant")
          .concat([{ role: "user" as const, content: text }])
          .map((m) => ({ role: m.role, content: m.content }));
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ crew: c, alerts: state.alerts, messages }),
        });
        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let lastModel = state.chatModel ?? "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const parsed = JSON.parse(payload) as {
                delta?: string;
                model?: string;
                error?: string;
              };
              if (parsed.error) {
                dispatch({
                  type: "ADD_CHAT_DELTA",
                  content: `\n\n[error: ${parsed.error}]`,
                  model: parsed.model ?? lastModel,
                });
              } else if (parsed.delta) {
                if (parsed.model) lastModel = parsed.model;
                dispatch({
                  type: "ADD_CHAT_DELTA",
                  content: parsed.delta,
                  model: lastModel,
                });
              }
            } catch {
              // ignore
            }
          }
        }
        dispatch({ type: "FINALIZE_CHAT", model: lastModel });
      } catch (err) {
        dispatch({
          type: "ADD_CHAT_DELTA",
          content: `[error: ${err instanceof Error ? err.message : String(err)}]`,
          model: "—",
        });
        dispatch({ type: "FINALIZE_CHAT", model: "—" });
      }
    },
    [state.crew, state.selected, state.alerts, state.chat, state.chatModel]
  );

  const startDemo = useCallback(() => {
    // reset first
    dispatch({ type: "RESET" });
    // schedule steps relative to next ticks
    demoRef.current = [
      {
        at: 4,
        msg: "Step 1 of 4 — Rafi's heart rate climbs under cardiac strain.",
        fn: () => {
          dispatch({ type: "SELECT_CREW", i: 2 });
          // toggle card flag on rafi's clone
          const next = state.crew.map((c, i) =>
            i === 2 ? { ...c, f: { ...c.f, card: 1 as const } } : c
          );
          next.forEach((c, i) => {
            if (i === 2) c.f.card = 1;
          });
        },
      },
      {
        at: 16,
        msg: "Step 2 of 4 — a solar storm raises radiation for the whole crew.",
        fn: () => {
          dispatch({ type: "TOG_FLAG", k: "storm" });
        },
      },
      {
        at: 28,
        msg: "Step 3 of 4 — rules raise the alerts. The AI score only advises.",
        fn: () => {
          /* no-op, the tick will fire alerts naturally */
        },
      },
      {
        at: 38,
        msg: "Step 4 of 4 — open an alert to see why it fired, then write the brief.",
        fn: () => {
          // auto-select the most recent active alert
          const a =
            state.alerts.find(
              (x) => state.crew[x.i].r[x.j] >= x.lv
            ) ?? state.alerts[0];
          if (a) dispatch({ type: "SELECT_ALERT", id: a.id });
        },
      },
    ];
    dispatch({ type: "SET_CAPTION", v: "Demo starting…" });
  }, [state.crew, state.alerts]);

  const reset = useCallback(() => {
    demoRef.current = null;
    dispatch({ type: "RESET" });
  }, []);

  // Pipeline stage highlight
  const stageRef = useRef<number | null>(null);
  const [stage, setStage] = useState<number | null>(null);
  useEffect(() => {
    if (stage === null) return;
    const id = setTimeout(() => setStage(null), 2200);
    return () => clearTimeout(id);
  }, [stage]);

  const sel = state.crew[state.selected];
  const selAlert =
    state.alerts.find((a) => a.id === state.selectedAlert) ?? null;

  const stageClass = (n: number) => (stage === n ? "ring-accent" : "");

  return (
    <main className="relative z-10 mx-auto max-w-[1500px] pb-12">
      <TopBar
        clock={tickClock(state.tick)}
        running={state.running}
        speed={state.speed}
        onToggle={() => dispatch({ type: "TOGGLE_RUN" })}
        onSpeed={(s) => dispatch({ type: "SET_SPEED", speed: s })}
      />
      <Pipeline
        onStage={(n) => setStage(n)}
        values={state.pipelineValues}
      />
      <ScenarioBar
        storm={state.storm}
        aiOn={state.aiOn}
        selectedFlags={sel.f}
        onToggle={(k) => dispatch({ type: "TOG_FLAG", k })}
        onDemo={startDemo}
        onReset={reset}
        caption={state.caption}
      />

      <div className="mx-6 grid grid-cols-1 gap-3 lg:grid-cols-[220px_1fr_360px]">
        <div className={stageClass(2)}>
          <CrewList
            crew={state.crew}
            selected={state.selected}
            aiOn={state.aiOn}
            onPick={(i) => dispatch({ type: "SELECT_CREW", i })}
          />
        </div>

        <main className="flex flex-col gap-3">
          <div className={stageClass(1)}>
            <VitalsCard crew={sel} />
          </div>
          <div className={stageClass(5)}>
            <AlertsCard
              alerts={state.alerts}
              crew={state.crew}
              selected={state.selectedAlert}
              onSelect={(id) => dispatch({ type: "SELECT_ALERT", id })}
            />
          </div>
          <div className={stageClass(5)}>
            <TraceCard alert={selAlert} crew={state.crew} />
          </div>
        </main>

        <aside className="flex flex-col gap-3">
          <div className={stageClass(3)}>
            <AIScoreCard crew={sel} aiOn={state.aiOn} />
          </div>
          <div className={stageClass(4)}>
            <RulesCard crew={sel} />
          </div>
          <div className={stageClass(6)}>
            <BriefCard
              crew={sel}
              alerts={state.alerts}
              brief={state.brief}
              briefModel={state.briefModel}
              briefLoading={state.briefLoading}
              chat={state.chat}
              chatStreaming={state.chatStreaming}
              chatModel={state.chatModel}
              onWriteBrief={writeBrief}
              onSendChat={sendChat}
            />
          </div>
        </aside>
      </div>

      <footer className="mx-6 mt-6 text-center text-[11px] text-white/30">
        Simulation is fully client-side · the LLM only writes prose · rules
        always decide alerts · deployed on Vercel
      </footer>
    </main>
  );
}
