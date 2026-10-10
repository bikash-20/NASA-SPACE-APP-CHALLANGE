"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { TopBar } from "@/components/TopBar";
import { Pipeline } from "@/components/Pipeline";
import { CrewList } from "@/components/CrewList";
import { VitalsCard } from "@/components/VitalsCard";
import { AIScoreCard } from "@/components/AIScoreCard";
import { RulesCard } from "@/components/RulesCard";
import { AlertsCard } from "@/components/AlertsCard";
import { TraceCard } from "@/components/TraceCard";
import { BriefCard } from "@/components/BriefCard";
import { TabbedPanel, type TabKey } from "@/components/TabbedPanel";
import { BottomTabs, type TabId } from "@/components/BottomTabs";
import { ScenarioPanel } from "@/components/ScenarioPanel";
import { CrewWideBanner } from "@/components/CrewWideBanner";
import {
  mkCrew,
  clock as tickClock,
  step as stepSim,
} from "@/lib/simulation";
import { mergeAlerts } from "@/lib/alertMerge";
import { findCrewWideEvents } from "@/lib/crewWide";
import { useMediaQuery } from "@/hooks/useMediaQuery";
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
      const c = next.crew[next.selected];
      const merged = mergeAlerts(next.alerts, next.crew);
      const active = merged.filter((g) => g.active).length;
      const mx = next.crew.reduce(
        (m, x) => Math.max(m, ...x.r),
        0
      );
      next.pipelineValues = [
        `t+${next.tick} · HR ${Math.round(c.hr)} / SpO₂ ${c.spo2.toFixed(0)}`,
        `HR ${c.bhr} · SpO₂ ≥94 · Sl ${c.sleep.toFixed(1)} h`,
        next.aiOn ? `${Math.round(c.ai)} / 100` : "offline",
        mx === 0 ? "all stable" : `${mx} firing`,
        active > 0 ? `${active} active` : "none",
        s.brief ? "ready" : "—",
      ];
      return next;
    }
    case "TOGGLE_RUN":
      return { ...s, running: !s.running };
    case "SET_SPEED":
      return { ...s, speed: a.speed };
    case "SELECT_CREW":
      return {
        ...s,
        selected: a.i,
        selectedAlert: null,
        brief: null,
        briefModel: null,
        briefLoading: false,
        chat: [],
        chatStreaming: false,
        chatModel: null,
      };
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
      for (let i = 0; i < 60; i++) {
        stepSim(crew, {
          storm: false,
          aiOn: true,
          emitAlerts: false,
          tick: 0,
        });
      }
      return {
        ...initial,
        crew,
        caption: CAP0,
        pipelineValues: ["", "", "", "", "", ""],
      };
    }
    default:
      return s;
  }
}

export default function Page() {
  const [state, dispatch] = useReducer(reducer, initial, (s) => {
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

  const demoRef = useRef<DemoStep[] | null>(null);
  const tickRef = useRef(state.tick);
  tickRef.current = state.tick;

  // Responsive flags
  const isMobile = useMediaQuery("(max-width: 639px)", false);
  const isTablet = useMediaQuery("(min-width: 640px) and (max-width: 1023px)", false);
  const isLg = useMediaQuery("(min-width: 1024px)", true);
  const isXl = useMediaQuery("(min-width: 1280px)", true);
  const isXxl = useMediaQuery("(min-width: 1600px)", true);

  const [mobileTab, setMobileTab] = useState<TabId>("vitals");
  const [tabKey, setTabKey] = useState<TabKey>("alerts");
  const [scenariosOpen, setScenariosOpen] = useState(false);
  const [demoActive, setDemoActive] = useState(false);

  useEffect(() => {
    setMobileTab("vitals");
  }, [state.selected]);

  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(() => {
      const t = tickRef.current;
      if (
        demoRef.current &&
        demoRef.current.length &&
        t >= demoRef.current[0].at
      ) {
        const s = demoRef.current.shift()!;
        s.fn();
        dispatch({ type: "SET_CAPTION", v: s.msg });
        if (demoRef.current.length === 0) {
          // Demo is fully consumed; clear the "active" flag so the next
          // "Run guided demo" is treated as a fresh run, and let the
          // caption sit with its last message (it will be cleared on Reset).
          setDemoActive(false);
          demoRef.current = null;
        }
      }
      const newAlerts: Alert[] = [];
      stepSim(state.crew, {
        storm: state.storm,
        aiOn: state.aiOn,
        emitAlerts: true,
        tick: t,
        onAlert: (a) => newAlerts.push(a),
      });
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
      if (isMobile) setMobileTab("brief");
    } catch (err) {
      dispatch({
        type: "SET_BRIEF",
        text: `**Brief failed:** ${err instanceof Error ? err.message : String(err)}`,
        model: "—",
      });
    }
  }, [state.briefLoading, state.crew, state.selected, isMobile]);

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
    dispatch({ type: "RESET" });
    setDemoActive(true);
    demoRef.current = [
      {
        at: 4,
        msg: "Step 1 of 4 — Rafi's heart rate climbs under cardiac strain.",
        fn: () => {
          dispatch({ type: "SELECT_CREW", i: 2 });
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
        fn: () => undefined,
      },
      {
        at: 38,
        msg: "Step 4 of 4 — open an alert to see why it fired, then write the brief.",
        fn: () => {
          const merged = mergeAlerts(state.alerts, state.crew);
          const first = merged[0];
          if (first) dispatch({ type: "SELECT_ALERT", id: first.key });
          if (isMobile) setMobileTab("alerts");
          else setTabKey("alerts");
        },
      },
    ];
    dispatch({ type: "SET_CAPTION", v: "Demo starting…" });
    setScenariosOpen(false);
  }, [state.crew, state.alerts, isMobile]);

  const reset = useCallback(() => {
    demoRef.current = null;
    setDemoActive(false);
    dispatch({ type: "RESET" });
    setScenariosOpen(false);
  }, []);

  const [stage, setStage] = useState<number | null>(null);
  useEffect(() => {
    if (stage === null) return;
    const id = setTimeout(() => setStage(null), 2200);
    return () => clearTimeout(id);
  }, [stage]);

  const sel = state.crew[state.selected];
  const selAlert =
    state.alerts.find((a) => `${a.i}-${a.j}` === state.selectedAlert) ??
    state.alerts.find((a) => a.id === state.selectedAlert) ??
    null;

  const mergedAlerts = useMemo(
    () => mergeAlerts(state.alerts, state.crew),
    [state.alerts, state.crew]
  );
  const activeAlertCount = mergedAlerts.filter((g) => g.active).length;

  // Crew-wide event detection (e.g. all 3 in Alert for radiation).
  const crewWide = useMemo(
    () => findCrewWideEvents(state.crew),
    [state.crew]
  );

  // Per-crew cause hints: factor name of the worst rule for that crew.
  // Used to add "Alert · radiation" suffixes on the status pills.
  const crewCauses = useMemo<(string | null)[]>(
    () =>
      state.crew.map((c) => {
        let worstIdx = 0;
        let worstLv = 0;
        for (let j = 0; j < c.r.length; j++) {
          if (c.r[j] > worstLv) {
            worstLv = c.r[j];
            worstIdx = j;
          }
        }
        if (worstLv === 0) return null;
        return c.R[worstIdx]?.n.toLowerCase() ?? null;
      }),
    [state.crew]
  );

  // Only show the demo caption while a demo is running; otherwise clear.
  const showCaption = demoActive && state.caption && state.caption !== CAP0;

  const stageClass = (n: number) => (stage === n ? "ring-accent" : "");

  // Reusable content blocks
  const alertsNode = (
    <AlertsCard
      alerts={state.alerts}
      crew={state.crew}
      selected={state.selectedAlert}
      onSelect={(id) => dispatch({ type: "SELECT_ALERT", id })}
    />
  );
  const whyNode = <TraceCard alert={selAlert} crew={state.crew} />;
  const briefNode = (
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
  );
  const vitalsNode = <VitalsCard crew={sel} />;
  const aiNode = <AIScoreCard crew={sel} aiOn={state.aiOn} />;
  const rulesNode = <RulesCard crew={sel} />;
  const tabbedNode = (
    <TabbedPanel
      active={tabKey}
      onChange={setTabKey}
      alertsBadge={activeAlertCount}
      alerts={alertsNode}
      why={whyNode}
      brief={briefNode}
    />
  );

  const scenariosNode = (
    <ScenarioPanel
      variant="inline"
      storm={state.storm}
      aiOn={state.aiOn}
      selectedFlags={sel.f}
      selected={sel}
      onToggle={(k) => dispatch({ type: "TOG_FLAG", k })}
      onDemo={startDemo}
      onReset={reset}
    />
  );

  return (
    <div className="relative z-10 flex min-h-dvh flex-col lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <TopBar
        clock={tickClock(state.tick)}
        running={state.running}
        speed={state.speed}
        onToggle={() => dispatch({ type: "TOGGLE_RUN" })}
        onSpeed={(s) => dispatch({ type: "SET_SPEED", speed: s })}
        onDemo={startDemo}
        onReset={reset}
        onOpenScenarios={() => setScenariosOpen(true)}
        aiOn={state.aiOn}
        compact={isMobile}
        hideScenarios={isLg}
      />

      <Pipeline
        onStage={setStage}
        values={state.pipelineValues}
        selected={sel}
        aiOn={state.aiOn}
        activeCount={activeAlertCount}
        briefReady={!!state.brief}
      />

      {showCaption && (
        <div
          className="border-b border-white/5 bg-accent/5 px-3 py-2 text-sm font-medium text-accent sm:px-5"
          role="status"
          aria-live="polite"
        >
          {state.caption}
        </div>
      )}

      <CrewWideBanner event={crewWide} />

      <main
        className={`flex min-h-0 flex-1 flex-col px-3 py-3 sm:px-5 sm:py-4 lg:min-h-0 lg:overflow-hidden ${
          isMobile ? "pb-24" : ""
        }`}
      >
        {isMobile ? (
          // Mobile: one panel at a time, switched by BottomTabs.
          <div className="space-y-3">
            {mobileTab === "vitals" && (
              <div className={stageClass(1)}>{vitalsNode}</div>
            )}
            {mobileTab === "alerts" && (
              <div className="space-y-3">
                <div className={stageClass(5)}>{alertsNode}</div>
                <div className={stageClass(5)}>{whyNode}</div>
              </div>
            )}
            {mobileTab === "ai" && (
              <div className="space-y-3">
                <div className={stageClass(3)}>{aiNode}</div>
                <div className={stageClass(4)}>{rulesNode}</div>
              </div>
            )}
            {mobileTab === "brief" && (
              <div className={stageClass(6)}>{briefNode}</div>
            )}
          </div>
        ) : isTablet ? (
          // Tablet: 2-col above, tabbed full-width below
          <div className="space-y-3">
            <div className={stageClass(2)}>
              <CrewList
                crew={state.crew}
                selected={state.selected}
                aiOn={state.aiOn}
                onPick={(i) => dispatch({ type: "SELECT_CREW", i })}
                variant="row"
                causes={crewCauses}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className={stageClass(1)}>{vitalsNode}</div>
              <div className="flex flex-col gap-3">
                <div className={stageClass(3)}>{aiNode}</div>
                <div className={stageClass(4)}>{rulesNode}</div>
              </div>
            </div>
            <div className={stageClass(5)}>{tabbedNode}</div>
          </div>
        ) : (
          // Desktop lg+: 3-column grid that fits one viewport at 1470x956.
          // The middle column has a fixed-height flex column where the tabbed
          // panel fills any remaining vertical space and scrolls internally,
          // so the rails match the centre column's height exactly.
          <div
            className={`grid h-full min-h-0 gap-3 ${
              isXxl
                ? "grid-cols-[280px_minmax(0,1fr)_360px]"
                : isXl
                ? "grid-cols-[260px_minmax(0,1fr)_340px]"
                : "grid-cols-[240px_minmax(0,1fr)_320px]"
            }`}
          >
            {/* Left rail: crew list fills the column height. */}
            <aside
              className={`${stageClass(2)} flex min-h-0 flex-col gap-2 overflow-y-auto`}
            >
              <CrewList
                crew={state.crew}
                selected={state.selected}
                aiOn={state.aiOn}
                onPick={(i) => dispatch({ type: "SELECT_CREW", i })}
                variant="rail"
                causes={crewCauses}
              />
            </aside>

            {/* Middle: vitals on top, tabbed panel fills remaining height. */}
            <div className="flex min-h-0 flex-col gap-3">
              <div className={`${stageClass(1)} shrink-0`}>{vitalsNode}</div>
              <div className={`${stageClass(5)} min-h-0 flex-1`}>
                {tabbedNode}
              </div>
            </div>

            {/* Right rail: AI score, Rules, scenario controls.
                Scrolls internally if the column is taller than the viewport. */}
            <aside
              className={`flex min-h-0 flex-col gap-3 overflow-y-auto pr-1`}
            >
              <div className={stageClass(3)}>{aiNode}</div>
              <div className={stageClass(4)}>{rulesNode}</div>
              <div className={stageClass(7)}>{scenariosNode}</div>
            </aside>
          </div>
        )}
      </main>

      {isMobile && (
        <BottomTabs
          active={mobileTab}
          onChange={setMobileTab}
          alertsBadge={activeAlertCount}
        />
      )}

      <ScenarioPanel
        variant="sheet"
        open={scenariosOpen}
        onClose={() => setScenariosOpen(false)}
        storm={state.storm}
        aiOn={state.aiOn}
        selectedFlags={sel.f}
        selected={sel}
        onToggle={(k) => dispatch({ type: "TOG_FLAG", k })}
        onDemo={startDemo}
        onReset={reset}
      />

      {!isMobile && !isLg && (
        <footer className="mt-auto px-3 py-2 text-center text-sm text-white/55 sm:px-5">
          Simulation runs in the browser · the LLM only writes prose · rules
          always decide alerts · deployed on Vercel
        </footer>
      )}
    </div>
  );
}
