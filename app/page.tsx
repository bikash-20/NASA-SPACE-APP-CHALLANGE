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
import { AskCard } from "@/components/AskCard";
import { BottomTabs, type TabId } from "@/components/BottomTabs";
import { ScenarioPanel } from "@/components/ScenarioPanel";
import { CrewWideBanner } from "@/components/CrewWideBanner";
import { MissionTimeline } from "@/components/MissionTimeline";
import { CrewComparison } from "@/components/CrewComparison";
import { TabbedPanel, type TabKey } from "@/components/TabbedPanel";
import {
  mkCrew,
  clock as tickClock,
  step as stepSim,
  DEFAULT_SIMULATION_SEED,
} from "@/lib/simulation";
import { mergeAlerts } from "@/lib/alertMerge";
import { findCrewWideEvents } from "@/lib/crewWide";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { Alert, ChatMessage, Crew } from "@/lib/types";

const CAP0 =
  'Press "Run guided demo" to walk the whole flow, or inject problems yourself.';

type CascadeErrorCode =
  | "not_configured"
  | "upstream_auth"
  | "no_models"
  | "catalog_unavailable"
  | "all_failed"
  | "unknown";

const GENERIC_BRIEF_ERROR =
  "The brief could not be generated. Please try again.";
const GENERIC_CHAT_ERROR =
  "The chat service could not complete the reply.";

const CASCADE_ERROR_MESSAGES: Record<CascadeErrorCode, string> = {
  not_configured:
    "Brief service is not configured on the server (missing OPENROUTER_API_KEY).",
  upstream_auth:
    "Brief service rejected the server's API key. Check OPENROUTER_API_KEY.",
  no_models:
    "No free models are available right now. Set OPENROUTER_MAX_PRICE_PER_1K to widen the cascade, or pin a model with OPENROUTER_MODEL.",
  catalog_unavailable:
    "Brief service cannot reach the model catalog. Try again in a few minutes.",
  all_failed:
    "All available models failed to respond. Try again in a few minutes.",
  unknown: GENERIC_BRIEF_ERROR,
};

/** Pick a user-facing message from a cascade error code, falling back
 *  to the generic message for unknown shapes. */
function cascadeMessage(
  code: string | undefined,
  fallback: string
): string {
  if (typeof code !== "string") return fallback;
  if (code in CASCADE_ERROR_MESSAGES) {
    return CASCADE_ERROR_MESSAGES[code as CascadeErrorCode];
  }
  return fallback;
}

type ScenarioPreset = "cardiac" | "sleep" | "storm" | "guided-demo";

interface MissionEvent {
  id: string;
  tick: number;
  at: string;
  kind: "alert" | "scenario" | "demo";
  title: string;
  detail: string;
  crewIndex?: 0 | 1 | 2;
  alertKey?: string;
  level?: Alert["lv"];
  scenario?: ScenarioPreset;
}

interface State {
  crew: Crew[];
  selected: 0 | 1 | 2;
  storm: boolean;
  aiOn: boolean;
  running: boolean;
  speed: 1 | 2 | 4;
  tick: number;
  seed: number;
  alerts: Alert[];
  events: MissionEvent[];
  selectedAlert: string | null;
  brief: string | null;
  briefModel: string | null;
  briefLoading: boolean;
  briefError: string | null;
  chat: ChatMessage[];
  chatStreaming: boolean;
  chatModel: string | null;
  chatError: string | null;
  caption: string;
  pipelineValues: string[];
  scenarioPreset: ScenarioPreset | null;
  demoActive: boolean;
  demoStep: number;
}

type Action =
  | { type: "ADVANCE" }
  | { type: "TOGGLE_RUN" }
  | { type: "SET_SPEED"; speed: 1 | 2 | 4 }
  | { type: "START_DEMO" }
  | {
      type: "SET_SCENARIO";
      scenario: Exclude<ScenarioPreset, "guided-demo">;
      crewIndex: 0 | 1 | 2;
    }
  | { type: "SELECT_CREW"; i: 0 | 1 | 2 }
  | { type: "TOG_FLAG"; k: "storm" | "ai" | "sleep" | "card" }
  | { type: "SELECT_ALERT"; id: string | null }
  | { type: "SET_BRIEF"; text: string; model: string }
  | { type: "SET_BRIEF_ERROR"; message: string }
  | { type: "SET_BRIEF_LOADING"; v: boolean }
  | { type: "ADD_CHAT_USER"; content: string }
  | { type: "ADD_CHAT_DELTA"; content: string; model: string }
  | { type: "SET_CHAT_ERROR"; message: string }
  | { type: "FINALIZE_CHAT"; model: string }
  | { type: "SET_CHAT_STREAMING"; v: boolean }
  | { type: "RESET" }
  | { type: "SET_CAPTION"; v: string };

const MAX_ALERTS = 250;
const MAX_EVENTS = 40;

function makeInitialState(): State {
  let crew = [0, 1, 2].map((i) => mkCrew(i as 0 | 1 | 2));
  let seed = DEFAULT_SIMULATION_SEED;
  for (let i = 0; i < 60; i += 1) {
    const result = stepSim(
      crew,
      { storm: false, aiOn: true, emitAlerts: false, tick: 0 },
      seed
    );
    crew = result.crew;
    seed = result.seed;
  }

  return {
    crew,
    selected: 0,
    storm: false,
    aiOn: true,
    running: true,
    speed: 1,
    tick: 0,
    seed,
    alerts: [],
    events: [],
    selectedAlert: null,
    brief: null,
    briefModel: null,
    briefLoading: false,
    briefError: null,
    chat: [],
    chatStreaming: false,
    chatModel: null,
    chatError: null,
    caption: CAP0,
    pipelineValues: ["", "", "", "", "", ""],
    scenarioPreset: null,
    demoActive: false,
    demoStep: 0,
  };
}

function scenarioEvent(
  title: string,
  detail: string,
  tick: number,
  scenario: ScenarioPreset,
  crewIndex?: 0 | 1 | 2
): MissionEvent {
  return {
    id: `scenario-${tick}-${scenario}`,
    tick,
    at: tickClock(tick),
    kind: "scenario" as const,
    title,
    detail,
    scenario,
    crewIndex,
  };
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "ADVANCE": {
      const tick = s.tick + 1;
      const simulation = stepSim(
        s.crew,
        {
          storm: s.storm,
          aiOn: s.aiOn,
          emitAlerts: true,
          tick: s.tick,
        },
        s.seed
      );
      let crew = simulation.crew;
      let selected = s.selected;
      let storm = s.storm;
      let demoStep = s.demoStep;
      let demoActive = s.demoActive;
      let caption = s.caption;
      let selectedAlert = s.selectedAlert;
      const firedEvents: MissionEvent[] = simulation.alerts.map((alert) => ({
        id: alert.id,
        tick,
        at: alert.t,
        kind: "alert",
        title: `${alert.n} · ${alert.lv === 2 ? "Alert" : "Watch"}`,
        detail: alert.why,
        crewIndex: alert.i,
        alertKey: `${alert.i}-${alert.j}`,
        level: alert.lv,
      }));
      const alerts = [...simulation.alerts, ...s.alerts].slice(0, MAX_ALERTS);
      const events = [...firedEvents, ...s.events].slice(0, MAX_EVENTS);

      if (demoActive && demoStep === 0 && tick >= 4) {
        selected = 2;
        crew = crew.map((member, index) =>
          index === selected
            ? { ...member, f: { ...member.f, card: 1 } }
            : member
        );
        demoStep = 1;
        caption = "Step 1 of 4 — Rafi's heart rate climbs under cardiac strain.";
        events.unshift(
          scenarioEvent(
            "Cardiac strain enabled",
            "Rafi's heart-rate rule now evaluates each mission tick.",
            tick,
            "guided-demo",
            2
          )
        );
      } else if (demoActive && demoStep === 1 && tick >= 16) {
        storm = true;
        demoStep = 2;
        caption = "Step 2 of 4 — a solar storm raises radiation for the whole crew.";
        events.unshift(
          scenarioEvent(
            "Solar storm enabled",
            "Radiation dose rate is elevated for the entire crew.",
            tick,
            "guided-demo"
          )
        );
      } else if (demoActive && demoStep === 2 && tick >= 28) {
        demoStep = 3;
        caption = "Step 3 of 4 — rules raise the alerts. The AI score only advises.";
      } else if (demoActive && demoStep === 3 && tick >= 38) {
        const first = mergeAlerts(alerts, crew)[0];
        selectedAlert = first?.key ?? null;
        demoStep = 4;
        demoActive = false;
        caption =
          "Step 4 of 4 — open an alert to see why it fired, then write the brief.";
        events.unshift({
          id: `demo-complete-${tick}`,
          tick,
          at: tickClock(tick),
          kind: "demo",
          title: "Guided demo complete",
          detail: "Review the rule evidence, then generate a simulation brief.",
          scenario: "guided-demo",
        });
      }

      const c = crew[selected];
      const merged = mergeAlerts(alerts, crew);
      const active = merged.filter((g) => g.active).length;
      const mx = crew.reduce(
        (m, x) => Math.max(m, ...x.r),
        0
      );
      return {
        ...s,
        crew,
        selected,
        storm,
        tick,
        seed: simulation.seed,
        alerts,
        events: events.slice(0, MAX_EVENTS),
        selectedAlert,
        demoStep,
        demoActive,
        caption,
        pipelineValues: [
        `t+${tick} · HR ${Math.round(c.hr)} / SpO₂ ${c.spo2.toFixed(0)}`,
        `HR ${c.bhr} · SpO₂ ≥94 · Sl ${c.sleep.toFixed(1)} h`,
        s.aiOn ? `${Math.round(c.ai)} / 100` : "offline",
        mx === 0 ? "all stable" : `${mx} firing`,
        active > 0 ? `${active} active` : "none",
        s.brief ? "ready" : "—",
        ],
      };
    }
    case "TOGGLE_RUN":
      return { ...s, running: !s.running };
    case "SET_SPEED":
      return { ...s, speed: a.speed };
    case "START_DEMO":
      return {
        ...makeInitialState(),
        demoActive: true,
        caption: "Demo starting…",
        scenarioPreset: "guided-demo",
      };
    case "SET_SCENARIO": {
      const fresh = makeInitialState();
      const crew =
        a.scenario === "cardiac" || a.scenario === "sleep"
          ? fresh.crew.map((member, index) =>
              index === a.crewIndex
                ? {
                    ...member,
                    f: {
                      ...member.f,
                      [a.scenario === "cardiac" ? "card" : "sleep"]: 1 as const,
                    },
                  }
                : member
            )
          : fresh.crew;
      const title =
        a.scenario === "cardiac"
          ? "Cardiac strain enabled"
          : a.scenario === "sleep"
            ? "Sleep debt enabled"
            : "Solar storm enabled";
      const detail =
        a.scenario === "storm"
          ? "Radiation dose rate is elevated for the entire crew."
          : `${a.scenario === "cardiac" ? "Heart-rate stress" : "Sleep disruption"} is enabled for ${crew[a.crewIndex].n}.`;
      return {
        ...fresh,
        crew,
        selected: a.crewIndex,
        storm: a.scenario === "storm",
        scenarioPreset: a.scenario,
        caption: `${title}. Simulation ready.`,
        events: [
          scenarioEvent(
            title,
            detail,
            0,
            a.scenario,
            a.scenario === "storm" ? undefined : a.crewIndex
          ),
        ],
      };
    }
    case "SELECT_CREW":
      return {
        ...s,
        selected: a.i,
        selectedAlert: null,
        demoActive: false,
        scenarioPreset: s.demoActive ? null : s.scenarioPreset,
        caption: s.demoActive
          ? "Guided demo stopped. Continue with manual controls."
          : s.caption,
        brief: null,
        briefModel: null,
        briefLoading: false,
        briefError: null,
        chat: [],
        chatStreaming: false,
        chatModel: null,
        chatError: null,
      };
    case "TOG_FLAG":
      if (a.k === "storm" || a.k === "ai") {
        const enabled = a.k === "storm" ? !s.storm : !s.aiOn;
        const label =
          a.k === "storm"
            ? `Solar storm ${enabled ? "enabled" : "cleared"}`
            : `AI risk scorer ${enabled ? "online" : "offline"}`;
        return {
          ...s,
          brief: null,
          briefModel: null,
          briefLoading: false,
          briefError: null,
          chat: [],
          chatStreaming: false,
          chatModel: null,
          chatError: null,
          storm: a.k === "storm" ? enabled : s.storm,
          aiOn: a.k === "ai" ? enabled : s.aiOn,
          scenarioPreset: a.k === "storm" ? null : s.scenarioPreset,
          demoActive: a.k === "storm" ? false : s.demoActive,
          caption:
            a.k === "storm" && s.demoActive
              ? "Guided demo stopped. Continue with manual controls."
              : s.caption,
          events: [
            {
              id: `manual-${s.tick}-${a.k}-${s.events.length}`,
              tick: s.tick,
              at: tickClock(s.tick),
              kind: "scenario" as const,
              title: label,
              detail:
                a.k === "storm"
                  ? "This global condition affects every crew member."
                  : "Rule-based alerts continue to run independently.",
            },
            ...s.events,
          ].slice(0, MAX_EVENTS),
        };
      }
      const f = { ...s.crew[s.selected].f };
      f[a.k] = (f[a.k] ? 0 : 1) as 0 | 1;
      const crew = s.crew.map((c, i) =>
        i === s.selected ? { ...c, f } : c
      );
      return {
        ...s,
        brief: null,
        briefModel: null,
        briefLoading: false,
        briefError: null,
        chat: [],
        chatStreaming: false,
        chatModel: null,
        chatError: null,
        crew,
        scenarioPreset: null,
        demoActive: false,
        caption: s.demoActive
          ? "Guided demo stopped. Continue with manual controls."
          : s.caption,
        events: [
          {
            id: `manual-${s.tick}-${a.k}-${s.events.length}`,
            tick: s.tick,
            at: tickClock(s.tick),
            kind: "scenario" as const,
            title: `${a.k === "card" ? "Cardiac strain" : "Sleep debt"} ${
              f[a.k] ? "enabled" : "cleared"
            }`,
            detail: `${s.crew[s.selected].n} · scenario flag changed.`,
            crewIndex: s.selected,
          },
          ...s.events,
        ].slice(0, MAX_EVENTS),
      };
    case "SELECT_ALERT":
      return { ...s, selectedAlert: a.id };
    case "SET_BRIEF":
      return {
        ...s,
        brief: a.text,
        briefModel: a.model,
        briefLoading: false,
        briefError: null,
      };
    case "SET_BRIEF_ERROR":
      return { ...s, briefLoading: false, briefError: a.message };
    case "SET_BRIEF_LOADING":
      return { ...s, briefLoading: a.v, briefError: null };
    case "ADD_CHAT_USER":
      return {
        ...s,
        chat: [...s.chat, { role: "user" as const, content: a.content }].slice(-40),
        chatError: null,
      };
    case "ADD_CHAT_DELTA": {
      const last = s.chat[s.chat.length - 1];
      const chat: ChatMessage[] =
        last && last.role === "assistant"
          ? [
              ...s.chat.slice(0, -1),
              {
                ...last,
                content: (last.content + a.content).slice(0, 12000),
              },
            ]
          : [
              ...s.chat,
              { role: "assistant" as const, content: a.content.slice(0, 12000) },
            ].slice(-40);
      return { ...s, chat, chatModel: a.model };
    }
    case "SET_CHAT_ERROR":
      return { ...s, chatError: a.message };
    case "FINALIZE_CHAT":
      return { ...s, chatModel: a.model, chatStreaming: false };
    case "SET_CHAT_STREAMING":
      return { ...s, chatStreaming: a.v };
    case "SET_CAPTION":
      return { ...s, caption: a.v };
    case "RESET":
      return makeInitialState();
    default:
      return s;
  }
}

export default function Page() {
  const [state, dispatch] = useReducer(reducer, null, makeInitialState);
  const briefController = useRef<AbortController | null>(null);
  const chatController = useRef<AbortController | null>(null);
  const briefRequestId = useRef(0);
  const chatRequestId = useRef(0);

  // Responsive flags
  const isMobile = useMediaQuery("(max-width: 639px)", false);
  const isCompact = useMediaQuery("(max-width: 1023px)", false);
  const isLg = useMediaQuery("(min-width: 1024px)", true);

  const [mobileTab, setMobileTab] = useState<TabId>("chat");
  const [desktopTab, setDesktopTab] = useState<TabKey>("ask");
  const [scenariosOpen, setScenariosOpen] = useState(false);
  const previousSelectedCrew = useRef(state.selected);

  const cancelPendingAi = useCallback(() => {
    briefRequestId.current += 1;
    chatRequestId.current += 1;
    briefController.current?.abort();
    chatController.current?.abort();
    briefController.current = null;
    chatController.current = null;
  }, []);

  useEffect(
    () => () => {
      briefController.current?.abort();
      chatController.current?.abort();
    },
    []
  );

  useEffect(() => {
    if (previousSelectedCrew.current !== state.selected) {
      previousSelectedCrew.current = state.selected;
      setMobileTab("vitals");
    }
  }, [state.selected]);

  useEffect(() => {
    if (state.demoStep !== 4) return;
    if (isCompact) setMobileTab("alerts");
  }, [state.demoStep, isCompact]);

  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        dispatch({ type: "ADVANCE" });
      }
    }, 1000 / state.speed);
    return () => clearInterval(id);
  }, [state.running, state.speed]);

  const writeBrief = useCallback(async () => {
    if (state.briefLoading) return;
    const requestId = ++briefRequestId.current;
    briefController.current?.abort();
    const controller = new AbortController();
    briefController.current = controller;
    const timeout = setTimeout(() => controller.abort(), 30_000);
    dispatch({ type: "SET_BRIEF_LOADING", v: true });
    try {
      const c = state.crew[state.selected];
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crew: c, aiOn: state.aiOn }),
        signal: controller.signal,
      });
      const body = (await res.json().catch(() => ({}))) as {
        text?: string;
        model?: string;
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        const code = typeof body.code === "string" ? body.code : undefined;
        const msg =
          typeof body.error === "string" && body.error.trim()
            ? cascadeMessage(code, body.error)
            : cascadeMessage(code, GENERIC_BRIEF_ERROR);
        throw Object.assign(new Error(msg), { code });
      }
      const j = body as { text: string; model: string };
      if (requestId !== briefRequestId.current) return;
      dispatch({ type: "SET_BRIEF", text: j.text, model: j.model });
      if (isCompact) setMobileTab("brief");
    } catch (err) {
      if (requestId !== briefRequestId.current) return;
      console.error("[brief] request failed", err);
      const fallback =
        err instanceof Error && err.message
          ? err.message
          : GENERIC_BRIEF_ERROR;
      const code =
        err && typeof err === "object" && "code" in err
          ? (err as { code?: string }).code
          : undefined;
      dispatch({
        type: "SET_BRIEF_ERROR",
        message: controller.signal.aborted
          ? "The brief request timed out. Please try again."
          : cascadeMessage(code, fallback),
      });
    } finally {
      clearTimeout(timeout);
      if (requestId === briefRequestId.current) briefController.current = null;
    }
  }, [state.aiOn, state.briefLoading, state.crew, state.selected, isCompact]);

  const sendChat = useCallback(
    async (text: string) => {
      const requestId = ++chatRequestId.current;
      chatController.current?.abort();
      const controller = new AbortController();
      chatController.current = controller;
      const timeout = setTimeout(() => controller.abort(), 60_000);
      dispatch({ type: "ADD_CHAT_USER", content: text });
      dispatch({ type: "SET_CHAT_STREAMING", v: true });
      try {
        const c = state.crew[state.selected];
        const messages = state.chat
          .filter((m) => m.role === "user" || m.role === "assistant")
          .concat([{ role: "user" as const, content: text }])
          .slice(-20)
          .map((m) => ({ role: m.role, content: m.content }));
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            crew: c,
            aiOn: state.aiOn,
            alerts: state.alerts.filter((alert) => alert.i === state.selected).slice(0, 20),
            messages,
          }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          throw new Error("The chat service is unavailable.");
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
                code?: string;
              };
              if (parsed.error) {
                if (requestId === chatRequestId.current) {
                  dispatch({
                    type: "SET_CHAT_ERROR",
                    message: cascadeMessage(parsed.code, parsed.error),
                  });
                }
              } else if (parsed.delta) {
                if (parsed.model) lastModel = parsed.model;
                if (requestId === chatRequestId.current) {
                  dispatch({
                    type: "ADD_CHAT_DELTA",
                    content: parsed.delta,
                    model: lastModel,
                  });
                }
              }
            } catch {
              if (requestId === chatRequestId.current) {
                dispatch({
                  type: "SET_CHAT_ERROR",
                  message: "The chat service sent an unreadable response.",
                });
              }
            }
          }
        }
        if (requestId === chatRequestId.current) {
          dispatch({ type: "FINALIZE_CHAT", model: lastModel });
        }
      } catch {
        if (requestId !== chatRequestId.current) return;
        dispatch({
          type: "SET_CHAT_ERROR",
          message: controller.signal.aborted
            ? "The chat request timed out. Please try again."
            : "The chat could not be completed. Please try again.",
        });
        dispatch({ type: "FINALIZE_CHAT", model: state.chatModel ?? "—" });
      } finally {
        clearTimeout(timeout);
        if (requestId === chatRequestId.current) chatController.current = null;
      }
    },
    [state.aiOn, state.crew, state.selected, state.alerts, state.chat, state.chatModel]
  );

  const startDemo = useCallback(() => {
    cancelPendingAi();
    dispatch({ type: "START_DEMO" });
    setScenariosOpen(false);
    if (isCompact) setMobileTab("vitals");
  }, [cancelPendingAi, isCompact]);

  const reset = useCallback(() => {
    cancelPendingAi();
    dispatch({ type: "RESET" });
    setScenariosOpen(false);
  }, [cancelPendingAi]);

  const setScenario = useCallback(
    (scenario: Exclude<ScenarioPreset, "guided-demo">) => {
      cancelPendingAi();
      dispatch({ type: "SET_SCENARIO", scenario, crewIndex: state.selected });
      setScenariosOpen(false);
      if (isCompact) setMobileTab("vitals");
    },
    [cancelPendingAi, isCompact, state.selected]
  );

  const toggleFlag = useCallback(
    (k: "storm" | "ai" | "sleep" | "card") => {
      cancelPendingAi();
      dispatch({ type: "TOG_FLAG", k });
    },
    [cancelPendingAi]
  );

  const replayScenario = useCallback(
    (scenario: ScenarioPreset, crewIndex?: 0 | 1 | 2) => {
      if (scenario === "guided-demo") {
        startDemo();
        return;
      }
      cancelPendingAi();
      dispatch({
        type: "SET_SCENARIO",
        scenario,
        crewIndex: crewIndex ?? state.selected,
      });
    },
    [cancelPendingAi, startDemo, state.selected]
  );

  const selectCrew = useCallback(
    (i: 0 | 1 | 2) => {
      cancelPendingAi();
      dispatch({ type: "SELECT_CREW", i });
    },
    [cancelPendingAi]
  );

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

  const stageClass = (n: number) => (stage === n ? "ring-accent" : "");

  const inspectAlert = (id: string | null) => {
    dispatch({ type: "SELECT_ALERT", id });
    if (!id) return;
    if (isCompact) setMobileTab("alerts");
  };

  // Reusable content blocks
  const alertsNode = (
    <div className="space-y-3">
      <AlertsCard
        alerts={state.alerts}
        crew={state.crew}
        selected={state.selectedAlert}
        onSelect={inspectAlert}
      />
      <MissionTimeline
        events={state.events}
        onInspectAlert={inspectAlert}
        onReplay={replayScenario}
      />
    </div>
  );
  const desktopAlertsNode = (
    <AlertsCard
      alerts={state.alerts}
      crew={state.crew}
      selected={state.selectedAlert}
      onSelect={inspectAlert}
    />
  );
  const timelineNode = (
    <MissionTimeline
      events={state.events}
      onInspectAlert={inspectAlert}
      onReplay={replayScenario}
    />
  );
  const whyNode = <TraceCard alert={selAlert} crew={state.crew} />;
  const crewNode = (
    <CrewComparison crew={state.crew} selected={state.selected} onSelect={selectCrew} />
  );
  const briefNode = (
    <BriefCard
      crew={sel}
      brief={state.brief}
      briefModel={state.briefModel}
      briefLoading={state.briefLoading}
      briefError={state.briefError}
      onWriteBrief={writeBrief}
    />
  );
  const chatNode = (
    <div
      className={
        isCompact ? "h-[min(60dvh,680px)] min-h-[360px]" : "h-full min-h-0"
      }
    >
      <AskCard
        crew={sel}
        chat={state.chat}
        chatStreaming={state.chatStreaming}
        chatModel={state.chatModel}
        chatError={state.chatError}
        onSendChat={sendChat}
      />
    </div>
  );
  const vitalsNode = <VitalsCard crew={sel} />;
  const aiNode = <AIScoreCard crew={sel} aiOn={state.aiOn} />;
  const rulesNode = <RulesCard crew={sel} />;

  const scenariosNode = (
    <ScenarioPanel
      variant="inline"
      storm={state.storm}
      aiOn={state.aiOn}
      selectedFlags={sel.f}
      selected={sel}
      activePreset={state.scenarioPreset}
      onPreset={setScenario}
      onToggle={toggleFlag}
      onDemo={startDemo}
      onReset={reset}
    />
  );

  return (
    <div className="dashboard-root relative z-10 flex min-h-dvh flex-col">
      <TopBar
        clock={tickClock(state.tick)}
        running={state.running}
        speed={state.speed}
        onToggle={() => dispatch({ type: "TOGGLE_RUN" })}
        onStep={() => {
          if (!state.running) dispatch({ type: "ADVANCE" });
        }}
        onSpeed={(s) => dispatch({ type: "SET_SPEED", speed: s })}
        onDemo={startDemo}
        onReset={reset}
        onOpenScenarios={() => setScenariosOpen(true)}
        aiOn={state.aiOn}
        compact={isCompact}
        hideScenarios={false}
      />

      <div className="desktop-simulation-row flex items-center justify-between gap-3 border-b border-white/5 px-3 py-1 text-xs sm:px-5">
        <span className="font-semibold tracking-[0.12em] text-cyan-200">
          SIMULATION
        </span>
        <span className="text-right text-white/60">
          Synthetic telemetry · deterministic rules decide · AI only advises
        </span>
      </div>

      <Pipeline
        onStage={setStage}
        values={state.pipelineValues}
        desktop={!isCompact}
        selected={sel}
        aiOn={state.aiOn}
        activeCount={activeAlertCount}
        briefReady={!!state.brief}
      />

      {(state.demoActive || state.scenarioPreset) &&
        state.caption !== CAP0 && (
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
        className={`desktop-dashboard-main flex flex-1 flex-col px-3 py-3 sm:px-5 sm:py-4 ${
          isCompact ? "pb-24" : ""
        }`}
      >
        {isCompact ? (
          // Compact screens: keep each dashboard section one tap away.
          <div
            id="mobile-dashboard-panel"
            role="tabpanel"
            aria-labelledby={`mobile-tab-${mobileTab}`}
            className="space-y-3"
          >
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
                <div className={stageClass(2)}>{crewNode}</div>
                <div className={stageClass(3)}>{aiNode}</div>
                <div className={stageClass(4)}>{rulesNode}</div>
              </div>
            )}
            {mobileTab === "brief" && (
              <div className={stageClass(6)}>{briefNode}</div>
            )}
            {mobileTab === "chat" && (
              <div className={stageClass(6)}>{chatNode}</div>
            )}
          </div>
        ) : (
          <div className="desktop-dashboard-grid grid min-h-0 items-stretch gap-3">
            <aside
              className={`${stageClass(2)} desktop-dashboard-left flex min-w-0 flex-col gap-3`}
            >
              <CrewList
                crew={state.crew}
                selected={state.selected}
                aiOn={state.aiOn}
                onPick={selectCrew}
                variant="rail"
                causes={crewCauses}
              />
              <div className={`${stageClass(7)} desktop-scenario-wrap`}>
                {scenariosNode}
              </div>
            </aside>

            <div className="desktop-dashboard-center flex min-w-0 flex-col gap-3">
              <div className={`${stageClass(1)} desktop-vitals-wrap`}>
                {vitalsNode}
              </div>
              <TabbedPanel
                active={desktopTab}
                onChange={setDesktopTab}
                alerts={desktopAlertsNode}
                why={whyNode}
                timeline={timelineNode}
                brief={briefNode}
                ask={chatNode}
                alertsBadge={activeAlertCount}
              />
            </div>

            <aside className="desktop-dashboard-right flex min-w-0 flex-col gap-3">
              <div className={stageClass(3)}>{aiNode}</div>
              <div className={`${stageClass(4)} desktop-rules-wrap`}>
                {rulesNode}
              </div>
            </aside>
          </div>
        )}
      </main>

      {isCompact && (
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
        activePreset={state.scenarioPreset}
        onPreset={setScenario}
        onToggle={toggleFlag}
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
