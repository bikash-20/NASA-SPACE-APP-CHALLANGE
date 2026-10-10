# NASA Space App Challenge — Crew Health Monitor
live link: https://crew-health-monitoring.vercel.app/
<img width="1280" height="761" alt="image" src="https://github.com/user-attachments/assets/f865a4e6-1598-4f41-8a2d-da066a50dd27" />
<img width="1280" height="761" alt="image" src="https://github.com/user-attachments/assets/6848eeca-9077-484d-bcc5-0fa425451a9c" />


A mission-control-style dashboard that simulates live crew telemetry, runs a **deterministic, rule-based** alert engine in the browser, and uses an LLM (via [OpenRouter](https://openrouter.ai)) to **write prose only** — never to raise alerts. Built for the NASA Space Apps Challenge.

> **The contract:** *rules decide, AI advises.*

The simulation, the AI risk score, and every alert are computed locally in the browser. The LLM is invoked server-side only to author a flight-surgeon status brief and to answer follow-up questions about that brief. The API key never leaves the server.

---

## Table of Contents

1. [What this project does](#what-this-project-does)
2. [Core design principle: rules decide, AI advises](#core-design-principle-rules-decide-ai-advises)
3. [Quick start](#quick-start)
4. [Deployment to Vercel](#deployment-to-vercel)
5. [The crew and the simulation model](#the-crew-and-the-simulation-model)
6. [Alert rules engine](#alert-rules-engine)
7. [Deterministic AI risk score](#deterministic-ai-risk-score)
8. [Alert lifecycle, hysteresis, and merging](#alert-lifecycle-hysteresis-and-merging)
9. [Server-side: LLM cascade and routes](#server-side-llm-cascade-and-routes)
10. [Data flow end-to-end](#data-flow-end-to-end)
11. [Architecture and folder layout](#architecture-and-folder-layout)
12. [UI: components and responsive layout](#ui-components-and-responsive-layout)
13. [State management](#state-management)
14. [Theming, animation, and accessibility](#theming-animation-and-accessibility)
15. [Environment variables and secrets](#environment-variables-and-secrets)
16. [Tech stack](#tech-stack)
17. [Local development scripts](#local-development-scripts)
18. [Operational notes](#operational-notes)
19. [Limitations and design choices](#limitations-and-design-choices)
20. [License](#license)

---

## What this project does

Crew Health Monitor is a single-page dashboard that demonstrates a realistic split-of-concerns between a **hard-coded medical decision engine** and a **soft, advisory AI**:

- **Simulates** three crew members on a long-duration deep-space mission (each with HR, SpO₂, sleep, stress, 30-day radiation dose, dose rate, and injected scenario flags).
- **Advances a mission clock** (starts at Day 112, 06:00) on every tick.
- **Computes five medical rules** in the browser (Heart rate, Oxygen, Sleep, Stress, Radiation). Each rule produces a level: `0 = Stable`, `1 = Watch`, `2 = Alert`.
- **Computes a deterministic AI risk score** (0–100) in the browser. The score blends each rule's contribution, with an additive bonus when three or more factors are simultaneously elevated. The score is purely advisory and is never used to raise an alert.
- **Raises alerts** when a rule's level *increases* or when a previously-cleared rule re-enters alarm (with hysteresis). Each alert records the reading, the rule that fired, the threshold, the current AI score, and the timestamp.
- **Merges consecutive firings** of the same `(crew, rule)` into a single row, distinguishing **active** (the rule is still in alarm right now) from **cleared** (the rule returned to stable).
- **Generates a flight-surgeon brief** by calling the server, which in turn calls an LLM through OpenRouter. The brief is structured as **Status / Active concerns / Suggested next step**.
- **Streams a chat** so the user can ask follow-up questions about the selected crew member. Answers are grounded in the same snapshot that produced the brief.
- **Stays responsive** across mobile, tablet, and desktop breakpoints with three distinct layouts, a 4-tab bottom nav on mobile, and a single-viewport 3-column grid on desktop.

There is a **Run guided demo** button that automates a scripted 4-step scenario (cardiac strain → solar storm → rules fire → brief written).

---

## Core design principle: rules decide, AI advises

The point of this project is to show that an LLM should never be the authoritative source of a medical or safety decision. The architecture enforces that boundary in three places:

1. **Alerts are emitted by `evalRules()` only.** The AI score is computed in `aiScore()` and stored on the crew, but no function in `lib/simulation.ts` consults it to decide whether to fire an alert.
2. **The AI score can be disabled.** Toggling *AI offline* updates the dashboard, removes the score from the brief, and shows "Scorer offline" in the AI card — but the rules keep running and alerts keep firing. This is the safety property we want to demonstrate.
3. **The LLM system prompts forbid raising alerts.** Both `/api/brief` and `/api/chat` ship system prompts that explicitly tell the model to use only the snapshot data and to never invent alerts or contradict the rules engine. The brief format is constrained to a fixed 3-section markdown shape.

This is the pattern: *deterministic logic for any state that could page someone, generative prose for the parts humans need to read.*

---

## Quick start

```bash
npm install
cp .env.local.example .env.local
# paste your OpenRouter key into .env.local
npm run dev
```

Open <http://localhost:3000>.

Without a key the dashboard still runs end-to-end — the simulation, rules, AI score, and UI all work — but the **Write brief** and **Send** buttons will return 500 with `OPENROUTER_API_KEY is not set on the server`.

---

## Deployment to Vercel

1. Push this folder to a new GitHub repo.
2. Import the repo at <https://vercel.com/new>.
3. In the project, go to **Settings → Environment Variables** and add:
   - `OPENROUTER_API_KEY` = your key from <https://openrouter.ai/keys>
4. Deploy.

`vercel.json` pins the deploy region to `iad1`, sets the framework to `nextjs`, and disables Next telemetry. The key is only read inside `app/api/*/route.ts` and is never shipped to the browser.

---

## The crew and the simulation model

`lib/simulation.ts` creates three crew members and a tick loop that mutates each crew member in place.

| Slot | Name              | Role            | Baseline HR | 30-day dose seed (mSv) |
|------|-------------------|-----------------|-------------|------------------------|
| 0    | Cdr. Amara Okafor | Commander       | 58 bpm      | 165                    |
| 1    | Dr. Lin Zhao      | Flight surgeon  | 64 bpm      | 158                    |
| 2    | Eng. Rafi Ahmed   | Engineer        | 70 bpm      | 171                    |

Each tick (`step()`) runs the following per-crew updates:

- **Stress**: pulls toward a target of `28 + 34·sleepFlag + 28·cardFlag + 18·storm`, with damping (`0.12`) and `±2` jitter. Clamped to `[0, 100]`.
- **Heart rate**: pulls toward `bhr · (1 + 0.6·cardFlag) + (stress − 30) · 0.12` with damping (`0.25`) and `±1.2` jitter. The `cardFlag` directly raises the heart-rate setpoint, so it is the most direct way to drive the *Heart rate* rule.
- **Blood oxygen**: pulls toward `93.2%` if `cardFlag` is set, otherwise `98%`, with damping (`0.2`) and `±0.3` jitter. Capped at 100.
- **Sleep (3-night average)**: pulls toward `3.8 h` if `sleepFlag` is set, otherwise `7.2 h`, with damping (`0.07`).
- **Radiation dose rate**: `3 mSv/h ± 0.5` if a solar storm is active, otherwise `0.04 ± 0.02 mSv/h`.
- **30-day dose**: `dose += rate · 0.5` per tick (each tick is ~30 s of mission time).

A 60-sample rolling history is kept per metric (`crew.H.hr`, `crew.H.spo2`, etc.) for sparkline and rule evaluation.

The mission clock (`clock()`) is also driven by ticks. `clock(tick) = "Day 112 + …  · HH:MM"`. Each tick represents 30 minutes of mission time, so a 4-step demo at ~1 tick/s compresses about 2 hours of mission activity.

### Scenario flags

Two scenario flags can be toggled per crew member (`f.sleep`, `f.card`); one flag is global (`storm`). Toggling happens in the page reducer, never in the simulator — the simulator only reads them. The ScenarioSheet is a mobile bottom-sheet wrapper around the same toggles.

---

## Alert rules engine

`lib/rules.ts` exports `evalRules(c)`, which returns five `RuleResult` rows. Each rule has a **name**, a **threshold description**, a **current value**, a **level** (`0|1|2`), and a **why** string.

| # | Rule        | Watch threshold        | Alert threshold        | Formula                                                                |
|---|-------------|------------------------|------------------------|------------------------------------------------------------------------|
| 0 | Heart rate  | +30% over baseline     | +50% over baseline     | `mean(last 6 HR) / bhr` > 1.3 → 1, > 1.5 → 2                            |
| 1 | Oxygen      | below 94%              | below 90%              | `spo2` < 94 → 1, < 90 → 2                                              |
| 2 | Sleep       | 3-night avg below 5.5h | 3-night avg below 4.5h | `sleep` < 5.5 → 1, < 4.5 → 2                                           |
| 3 | Stress      | index above 75         | index above 90         | `stress` > 75 → 1, > 90 → 2                                            |
| 4 | Radiation   | dose ≥ 80% (200 mSv) or rate ≥ 1 mSv/h | dose ≥ 95% (237.5 mSv) | `dose ≥ 200 OR rate ≥ 1` → 1, `dose ≥ 237.5` → 2                        |

Heart rate uses a 6-sample trailing mean (`mean(c.H.hr.slice(-6))`) to avoid single-spike noise. The rest use the current tick value. The "why" string is what the LLM later reads to write a brief.

`RulesCard` renders one row per rule, color-coded by the current level. The `Rules` panel is tagged with the badge **"decides"**.

---

## Deterministic AI risk score

`lib/aiScore.ts` exports `aiScore(c)`, which mutates `c.F` (factor contributions) and `c.ai` (the smoothed score).

**Per-factor contribution (0..max):**

| Factor     | Max | Formula                                                                |
|------------|-----|------------------------------------------------------------------------|
| Heart rate | 30  | `clamp((mean(6) / bhr − 1) / 0.5, 0, 1) · 30`                          |
| Oxygen     | 20  | `clamp((98 − spo2) / 8, 0, 1) · 20`                                   |
| Sleep      | 20  | `clamp((7 − sleep) / 3.5, 0, 1) · 20`                                  |
| Stress     | 15  | `clamp((stress − 30) / 60, 0, 1) · 15`                                 |
| Radiation  | 15  | `clamp((dose − 165) / 85, 0, 1) · 10` + `clamp(rate / 3, 0, 1) · 5`    |

The raw sum `s` is the sum of contributions. If **three or more** factors are above 30% of their own max, an additional `+12` "polyfactorial" bonus is added. The smoothed score is:

```
c.ai = c.ai · 0.6 + min(100, s) · 0.4
```

This is a first-order IIR filter that produces a smooth, oscillation-free display. The `band()` helper labels the score as **Low** (`<30`), **Watch** (`<60`), or **High** (`>=60`).

The `AIScoreCard` is tagged with the badge **"advisory"** and shows the running score with an animated counter, the per-factor bars, and an explicit one-liner that the score never raises an alert on its own. When `aiOn` is `false` the card is replaced with "Scorer offline. Rules keep running, so alerts still fire."

---

## Alert lifecycle, hysteresis, and merging

### Emission

`lib/simulation.ts → step()` evaluates the rules and, for each rule slot `j`, decides whether to fire an `Alert` for this tick:

- A rule **re-arms** whenever its level is `0` on a tick (`c.armed[j] = true`).
- A new alert is emitted when **either** the level steps up (`x.lv > c.r[j]`) **or** the rule re-arms and is now non-zero (`x.lv > 0 && c.armed[j]`). On fire, `c.armed[j]` is set to `false`, so subsequent ticks at the same level do not re-fire.
- Each emitted `Alert` carries the tick id, the mission clock timestamp, the crew index, the rule index, the rule name and threshold, the level, the rule's `why` string, the AI score at that moment, and the AI-on flag. Alerts are pushed to a client-side `Alert[]` via the `onAlert` callback, then the page reducer prepends them to the visible list.

The net effect is that you see a **fresh row each time the level steps up**, but a rule that sits in *Watch* for many ticks produces a single row, not 50.

### Merging

`lib/alertMerge.ts → mergeAlerts(alerts, crew)` groups alerts by their `(i, j)` key and produces one `MergedAlert` per group. The merge:

- Counts firings and tracks the first and latest timestamp.
- Always shows the latest `why`, the latest level, the latest AI score, and the **current** rule value (pulled from `crew[i].R[j]`, so it stays accurate after the alert was fired).
- Marks the row `active` when `crew[i].r[j] >= a.lv` right now — i.e. the rule is still in alarm in the current tick, even if the original alert was fired several ticks ago.

`AlertsCard` renders active rows first, then a collapsible "Last N cleared" list. `TraceCard` is the **"Why did this alert fire?"** panel that walks through the five-line decision trace: the reading, the rule, the AI score at the time, the decision, and the suggested action.

---

## Server-side: LLM cascade and routes

`lib/openrouter.ts` is the server-only module that talks to OpenRouter. It implements a **model cascade** so the app degrades gracefully when one provider is down, rate-limited, or empty.

### The cascade

On first use, `loadCascade()` fetches `https://openrouter.ai/api/v1/models` (no auth required) with a 10-minute `revalidate`. It filters to chat-capable models (`output_modalities` includes `text`, or `modality` contains `text` / `->text`) and ranks them by:

1. **Free first**: +1000 if both prompt and completion pricing are 0, +500 if prompt is 0 only.
2. **Price**: otherwise `-1000 · (prompt + completion)`.
3. **Context**: +100 if `context_length ≥ 32 000`.
4. **Family preference** (in order): `llama`, `qwen`, `gemini`, `deepseek`, `glm`, `mistral`, `claude`, `gpt`, `command`. +50 if the id contains any of these.

The top **5** ids are cached in module-scope memory for 10 minutes, with an inflight de-dup so concurrent first-uses don't fire two requests. Every API route then iterates those 5 ids in order:

- **Non-streaming** (`callCascade`): 8 s per model, 600 max tokens default, `temperature ≈ 0.4`.
- **Streaming** (`streamCascade`): 16 s per model, 800 max tokens default, `temperature ≈ 0.5`.

On `401`/`403` the cascade aborts immediately — the key is bad, retrying won't help. On any other failure the loop logs a warning and tries the next model. The first model to return a non-empty `choices[0].message.content` wins. Vercel function logs show `[openrouter] served by: <id>` for every success.

### `/api/brief` (POST, non-streaming)

`app/api/brief/route.ts`. Request body: `{ crew: Crew }`. Builds a deterministic text snapshot of the selected crew member with `snapshotForLLM(crew, [])` (rounded numbers, no PII, no timestamps that would tie the LLM to one specific tick). Sends it under a system prompt that fixes the output shape to three sections — **Status** / **Active concerns** / **Suggested next step** — and forbids raising new alerts. Response: `{ text, model }`. Errors return `{ error }` with status 500.

### `/api/chat` (POST, streaming)

`app/api/chat/route.ts`. Request body: `{ crew, alerts, messages }`. The route always prepends the snapshot as a hidden first user message and a fixed assistant acknowledgement ("Understood. I have the snapshot. What would you like to know?"), then appends the user's transcript. It opens a `ReadableStream` of `text/event-stream` chunks. Each upstream SSE `data:` line is re-emitted as a client-friendly JSON chunk:

```
data: {"delta":"<text>","model":"<id>"}
data: [DONE]
```

The client (`sendChat` in `app/page.tsx`) reads the stream with a `ReadableStreamDefaultReader`, decodes chunks, parses each `data:` line, dispatches `ADD_CHAT_DELTA` to the reducer, and finalizes the model on `[DONE]`.

Both routes are `runtime = "nodejs"` and `dynamic = "force-dynamic"` because they read the API key from the environment on every request.

---

## Data flow end-to-end

1. **Boot** — `app/page.tsx` calls `mkCrew(0|1|2)` for three crew members and runs `stepSim` 60 times to warm the rolling histories, so the sparklines aren't empty on first paint.
2. **Tick** — A `setInterval` (period = `1000 / speed`, where `speed ∈ {1, 2, 4}`) runs `stepSim(crew, opts)`. For each crew member it updates vitals, recomputes the AI score, evaluates the rules, and (if `emitAlerts`) emits new alerts via `onAlert`. New alerts are prepended into the page state. The reducer's `TICK` action also recomputes the `pipelineValues` shown in the top pipeline strip.
3. **Display** — Each card reads from `state.crew[state.selected]`. The `Pipeline` strip animates the colored top-border per step; clicking a step briefly highlights the corresponding panel on screen (via `stageClass(n)`).
4. **Inject** — The user toggles a scenario flag (sleep, cardiac, storm, AI on/off). The reducer mutates either the global flag or the selected crew member's `f` object, and the next tick reflects the change.
5. **Brief** — Clicking **Write brief** POSTs the selected crew member to `/api/brief`, which calls `callCascade` and returns the model id alongside the text. The brief renders with a minimal Markdown parser (`Md` in `BriefCard.tsx`) that handles headings and bullets.
6. **Chat** — Sending a message POSTs the full transcript to `/api/chat` and consumes the SSE stream. Each delta is appended to the last assistant message in the reducer; on `[DONE]` the model label is finalized.

---

## Architecture and folder layout

```
nasa-space-app/
├─ app/                         # Next.js 15 App Router
│  ├─ layout.tsx                # Root layout. Loads Inter + JetBrains Mono, wraps in MotionConfig.
│  ├─ globals.css               # Responsive root font, body gradient, focus ring, scrollbar.
│  ├─ page.tsx                  # The dashboard. useReducer + tick loop. The whole app's brain.
│  └─ api/
│     ├─ brief/route.ts         # Non-streaming LLM brief.
│     └─ chat/route.ts          # Streaming LLM chat over SSE.
│
├─ components/
│  ├─ TopBar.tsx                # Title, mission clock, scenarios, AI toggle, play/pause, 1×/2×/4×.
│  ├─ Pipeline.tsx              # 6-step strip (Simulate → Baseline → AI score → Rules → Alert → Brief).
│  ├─ CrewList.tsx              # 3 layout variants: pills (sm), row (md), rail (lg+).
│  ├─ VitalsCard.tsx            # 5 tiles: HR, SpO₂, Sleep, Stress, Radiation (sparklines + progress bars).
│  ├─ AIScoreCard.tsx           # Big animated score, per-factor bars, "advisory" tone.
│  ├─ RulesCard.tsx             # The 5 rules with current value, threshold, and "decides" tone.
│  ├─ AlertsCard.tsx            # Active + cleared merged-alert rows, collapsible cleared list.
│  ├─ TraceCard.tsx             # "Why did this alert fire?" 5-line decision trace.
│  ├─ BriefCard.tsx             # Markdown-rendered brief + sticky chat thread + input.
│  ├─ TabbedPanel.tsx           # Desktop/tablet container with Alerts / Why / Brief & ask tabs.
│  ├─ BottomTabs.tsx            # Mobile bottom tab bar (Vitals / Alerts / AI & rules / Brief).
│  ├─ ScenarioBar.tsx           # Inline scenario inject row (used on tablet).
│  ├─ ScenarioSheet.tsx         # Mobile bottom sheet for scenario injection.
│  └─ ui/                       # Tiny design system
│     ├─ Panel.tsx              # Glassy rounded card with subtle scanline overlay and tone variants.
│     ├─ Button.tsx             # Variants: default, active, danger, primary, ghost.
│     ├─ Sparkline.tsx          # Recharts-based mini line chart with dashed threshold.
│     └─ ProgressBar.tsx        # Color-tinted bar with marks and overflow hatching.
│
├─ hooks/
│  └─ useMediaQuery.ts          # SSR-safe media query subscription.
│
├─ lib/
│  ├─ types.ts                  # Crew, Alert, RuleResult, VitalsHistory, ChatMessage, Level.
│  ├─ simulation.ts             # mkCrew, clock, step (the tick), mission-time math.
│  ├─ rules.ts                  # evalRules(c) → 5 RuleResult rows.
│  ├─ aiScore.ts                # aiScore(c) and band() — deterministic, browser-only.
│  ├─ alertMerge.ts             # mergeAlerts(alerts, crew) → MergedAlert[].
│  ├─ serialize.ts              # snapshotForLLM(c, alerts) — the prompt payload.
│  ├─ openrouter.ts             # Cascade: getCascade, callCascade, streamCascade. Server-only.
│  ├─ cn.ts                     # clsx + tailwind-merge helper.
│  └─ colors.ts                 # Level → color and a constants table.
│
├─ public/                      # (empty)
├─ .env.local.example           # OPENROUTER_API_KEY=sk-or-v1-...
├─ next.config.mjs              # reactStrictMode + experimental optimizePackageImports for recharts, framer-motion.
├─ tailwind.config.ts           # Color tokens, font tokens, scan/pulseRing/shake keyframes.
├─ postcss.config.mjs
├─ tsconfig.json                # @/* path alias → ./*, strict, bundler resolution.
├─ vercel.json                  # iad1 region, framework: nextjs, NEXT_TELEMETRY_DISABLED=1.
└─ package.json                 # next 15, react 19 RC, framer-motion 11, recharts 2.13, tailwind 3.4.
```

---

## UI: components and responsive layout

The layout is a hand-rolled three-breakpoint responsive grid driven by `useMediaQuery`:

| Breakpoint | Class | Layout                                                                                                    |
|------------|-------|-----------------------------------------------------------------------------------------------------------|
| `< 640px`  | mobile    | One panel at a time, switched by **BottomTabs**. Top bar collapses to compact (sticky). Scenarios via **ScenarioSheet**. |
| `640–1023px` | tablet | 2-col grid (vitals + AI/rules), tabbed panel below. Scenarios inline via **ScenarioBar**.                  |
| `≥ 1024px`  | desktop  | True single-viewport 3-column grid: **rail (240/260/280 px)** \| **vitals + tabbed** \| **AI + rules (320/340/360 px)**. |

The top **Pipeline** strip is always visible. Clicking a step briefly highlights the corresponding panel on screen with a `ring-accent` ring for ~2.2 s, so a presenter can walk a viewer through the six steps in order.

`TabbedPanel` (desktop/tablet) hosts **Alerts / Why / Brief & ask** under one container. `BottomTabs` (mobile) provides **Vitals / Alerts / AI & rules / Brief** with an animated underline and an alerts badge.

`ScenarioSheet` is a motion-spring bottom sheet that locks body scroll while open and renders a clear hierarchy of toggles with their scope ("Affects all crew" vs "Selected crew member").

---

## State management

`app/page.tsx` owns a single `useReducer` whose `State` covers crew, simulation flags, alerts, the selected alert, the brief and its model, the chat transcript and streaming state, the mission caption, and the pipeline strip values. The reducer's `Action` union is exhaustive and the case fallthrough is safe (`default: return s`).

A `tickRef` ref mirrors the latest `state.tick` so the `setInterval` callback can read it without re-binding on every tick. The interval itself re-binds only when `running`, `speed`, `storm`, `aiOn`, or `crew` change.

A `demoRef` holds a queue of scripted `{ at, msg, fn }` steps. The tick handler peeks at the queue head and runs any step whose `at <= currentTick`, updating the mission caption and dispatching the right action. The four-step demo is: select Rafi + cardiac strain → toggle storm → (rules fire passively) → open the first alert + write the brief.

`RESET` rebuilds the three crew members, pre-warms 60 ticks with `emitAlerts: false`, and resets every other field to the initial state.

---

## Theming, animation, and accessibility

- **Color tokens** (`tailwind.config.ts`): `ink`, `bg` (default and `deep`), `panel`, `line`, `accent` (+ `soft`), `ok`, `watch`, `bad`. The body has a layered radial gradient (violet top-right, emerald bottom-left) on `#060912`. A repeating scanline overlay sits at 4% opacity with `mix-blend-mode: screen` and is hidden under `prefers-reduced-motion: reduce`.
- **Fonts**: `Inter` for body, `JetBrains Mono` for the clock, vitals, and code-y labels. Both ship via `next/font/google` and are exposed as CSS variables.
- **Animations**: framer-motion drives panel mount, tab swap, the alert list collapse, the AI score counter, the bottom sheet, and the pipeline step hover. Everything is gated by `MotionConfig reducedMotion="user"`, and CSS animations are also throttled by the reduced-motion media query.
- **Responsive root font**: 16px on mobile, 17px on `≥1024px`, 18px on `≥1600px`. Several module-scoped CSS variables (`--fs-vital`, `--fs-ai`, `--rail-w-lg`, etc.) keep large-screen typography and column widths consistent.
- **Accessibility**: every interactive surface has a `:focus-visible` ring, every tab control has `role="tab"` + `aria-selected`, the alerts tab and the mobile tab bar both carry `aria-label`, the play/pause button toggles its `aria-label`, every metric has `role="progressbar"` on its bar, and the live status region above the layout (`role="status" aria-live="polite"`) announces demo captions to screen readers.

---

## Environment variables and secrets

`.env.local.example`:

```
# Get your key at https://openrouter.ai/keys
# This stays on the server only. Never prefix with NEXT_PUBLIC_.
OPENROUTER_API_KEY=sk-or-v1-...
```

Rules:

- The key is read **only** inside `lib/openrouter.ts` (via `process.env.OPENROUTER_API_KEY`), which is imported only by `app/api/*/route.ts`. It is never read in client code and never appears in `NEXT_PUBLIC_*`.
- `.env*.local` is git-ignored.
- On Vercel, set `OPENROUTER_API_KEY` in **Settings → Environment Variables** for the production environment.

`vercel.json` sets `NEXT_TELEMETRY_DISABLED=1` for the build to silence the Next.js telemetry prompt.

---

## Tech stack

- **Framework**: Next.js `15.0.3` (App Router) on the `nodejs` runtime
- **UI**: React `19.0.0-rc`, TypeScript `5.6`, Tailwind CSS `3.4`
- **Animation**: framer-motion `11.11`
- **Charts**: recharts `2.13` (Sparkline only — no full dashboard charts)
- **Class composition**: `clsx` + `tailwind-merge` via `lib/cn.ts`
- **Fonts**: `next/font/google` (Inter, JetBrains Mono)
- **LLM**: OpenRouter chat completions API (any model that returns `output_modalities: ["text"]`)
- **Hosting**: Vercel (region `iad1`)

`next.config.mjs` enables `experimental.optimizePackageImports` for `recharts` and `framer-motion` to keep cold-start and bundle size down.

---

## Local development scripts

```bash
npm run dev     # next dev — http://localhost:3000
npm run build   # next build
npm run start   # next start — production server
npm run lint    # next lint (eslint-config-next)
```

`tsc` is configured but not wired to a script; `next build` will type-check the project.

---

## Operational notes

- **First request latency**: the first LLM call after deploy fetches the model list (cold, ~1 request) and then tries the top model. You may see one or two `[openrouter] model failed` warnings on a cold start; the cascade handles them. Subsequent calls within 10 minutes reuse the cache.
- **Where the model name comes from**: every successful cascade call logs `[openrouter] served by: <model>`. That log line is how you confirm which model the brief or chat was actually written by. The model id is also surfaced in the UI as `model · <id>` under each brief and chat thread.
- **Resetting**: `Reset` clears scenario flags, alerts, the brief, the chat, and rebuilds the crew. The mission clock goes back to `Day 112, 06:00`.
- **No persistence**: nothing is written to storage. Refresh the page and you get a fresh mission.

---

## Limitations and design choices

- **Simulation is a model, not data.** The crew are stylized agents, not real astronauts. Vitals are tuned so the demo can show off every rule in under a minute. Thresholds (HR +30%/+50%, SpO₂ 94/90, sleep 5.5/4.5, stress 75/90, dose 80/95) match the rule file verbatim.
- **The AI score is intentionally trivial.** A weighted blend of normalized factors plus a 3-factor bonus. It exists to demonstrate the *separation* of scoring and alerting, not to be a clinical model.
- **No authentication.** The dashboard is a demo. There is no user account, no per-crew persistence, no historical data export.
- **OpenRouter is the only LLM provider.** Swapping to OpenAI, Anthropic, or a local server means replacing `lib/openrouter.ts`; the rest of the system speaks the generic `{ text, model }` / SSE shape.
- **Cascade is rank-based, not round-robin.** If a paid model is highly ranked it will keep winning; if a free model is highly ranked it will keep being tried first. This is the intended behavior for a NASA-style demo on a small budget.
- **The "Why" trace is shown, not generated.** `TraceCard` reads the rule that fired and lays out a fixed 5-line decision record. The LLM never writes this — it is always derived from the rule result and the AI score at firing time.

---

## License

This project was built for the NASA Space Apps Challenge. No license is bundled; treat the source as MIT-licensed for the purposes of review and reuse, unless a `LICENSE` file is added by the maintainer.
