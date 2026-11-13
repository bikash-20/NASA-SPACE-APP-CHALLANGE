# NASA Space App Challenge — Crew Health Monitor
live link: https://crew-health-monitoring.vercel.app/
watch the full video you will get an good overview about the system: https://youtu.be/d5XwjDgJWuE?si=fhKd_bOfqb9zbDM2
<img width="1280" height="796" alt="image" src="https://github.com/user-attachments/assets/d067918d-0478-47f9-9adb-f4c261674eed" />
<img width="1280" height="796" alt="image" src="https://github.com/user-attachments/assets/c4853200-6c21-466d-9419-93b4f2ff5bdf" />






A mission-control-style dashboard that simulates crew telemetry, runs a **deterministic, rule-based** alert engine in the browser, and uses an LLM to **write prose only** — never to raise alerts. Choose the existing [OpenRouter](https://openrouter.ai) service or connect directly from the browser to a local Ollama server.

> **The contract:** *rules decide, AI advises.*

The simulation, AI risk score, and every alert are computed locally in the browser. OpenRouter requests run through the server and keep the API key server-side; local Ollama requests go directly from the browser to the host configured in Preferences. An optional installable app shell keeps the dashboard and deterministic simulation available offline after installation and an initial load. Models and voice services must be installed and running locally. This is not a real flight surgeon and does not provide medical guidance.

---

## Table of Contents

1. [What this project does](#what-this-project-does)
2. [AstroGuard: Autonomous Multi-Tenant Architecture](#astroguard-autonomous-multi-tenant-architecture)
3. [System vision and prototype scope](docs/system-vision.md)
4. [Core design principle: rules decide, AI advises](#core-design-principle-rules-decide-ai-advises)
5. [Quick start & Demo Credentials](#quick-start)
6. [Deployment to Vercel](#deployment-to-vercel)
7. [The crew and the simulation model](#the-crew-and-the-simulation-model)
8. [Alert rules engine](#alert-rules-engine)
9. [Deterministic AI risk score](#deterministic-ai-risk-score)
10. [Alert lifecycle, hysteresis, and merging](#alert-lifecycle-hysteresis-and-merging)
11. [Server-side: LLM cascade and routes](#server-side-llm-cascade-and-routes)
12. [Data flow end-to-end](#data-flow-end-to-end)
13. [Architecture and folder layout](#architecture-and-folder-layout)
14. [UI: components and responsive layout](#ui-components-and-responsive-layout)
15. [State management](#state-management)
16. [Theming, animation, and accessibility](#theming-animation-and-accessibility)
17. [Environment variables and secrets](#environment-variables-and-secrets)
18. [Tech stack](#tech-stack)
19. [Local development scripts](#local-development-scripts)
20. [Operational notes](#operational-notes)
21. [Limitations and design choices](#limitations-and-design-choices)
22. [License](#license)

---

## AstroGuard: Autonomous Multi-Tenant Architecture

AstroGuard extends the core simulation into a fully featured space-flight medical operations ecosystem, providing isolated views with role-based access control, clinical triage workflows, and comprehensive biometric tracking:

### 1. Dedicated Multi-Role Consoles

- **Astronaut Portals (`crew-0`, `crew-1`, `crew-2`)**: Each astronaut accesses a private mission console with collapsible sticky navigation, dedicated telemetry, private tele-health channels with the flight surgeon, and their own AI Copilot.
- **Flight Surgeon Medical Operations Hub (`doctor`)**: Dr. Evelyn Vance oversees the entire crew roster, viewing real-time clinical triage signals (`Critical`, `Warning`, `Nominal`), live Lead-II ECG monitors, fleet-wide IoT wearable status, and initiating encrypted voice/video calls.
- **Mission Control Admin (`admin`)**: Flight Operations Director oversees the 3-crew fleet overview with the original deterministic 5-rule engine, AI risk scoring, scenario injection, and interactive timeline.

### 2. Exposed 1-Click Evaluation Credentials

The login gateway presents pre-configured 1-click evaluation profiles for instant testing without manual typing:

| Profile | Role | Identifier | Email | Password |
|---|---|---|---|---|
| **Cdr. Amara Okafor** | Mission Commander | `AST-001` | `amara@ares.nasa.gov` | `amara123` |
| **Dr. Lin Zhao** | Flight Surgeon & Science Specialist | `AST-002` | `lin@ares.nasa.gov` | `lin123` |
| **Eng. Rafi Ahmed** | Systems & Avionics Engineer | `AST-003` | `rafi@ares.nasa.gov` | `rafi123` |
| **Dr. Evelyn Vance** | Chief Flight Surgeon | `MED-002` | `doctor@ares.nasa.gov` | `flightdoc` |
| **Flight Operations Director** | Mission Operations Director | `FLIGHT-01` | `flight@ares.nasa.gov` | `missioncontrol` |

### 3. Space-Grade Clinical Telemetry & Diagnostics

- **Real-Time Lead-II ECG Waveform Canvas (`ECGMonitor.tsx`)**: Renders a dynamic 50 mm/s cardiac rhythm line synchronized with instantaneous heart rate, computing real-time interval diagnostics (PR: 142ms, QRS: 86ms, QTc: 412ms) and rhythm classifications (Normal Sinus Rhythm, Sinus Tachycardia).
- **Macro & Metabolic Reserve HUD (`MacroGauges.tsx`)**: High-contrast circular progress rings tracking Protein, Healthy Fats, Fiber, and Water targets against actual consumption, alongside a Basal Reserve energy bar (kcal).
- **Micro-Array Biomarker Assay (`MicroArrayAssay.tsx`)**: Spectrometry profiling for 6 essential vitamins (A, B-Complex, C, D3, E, K) and 5 essential minerals (Iron, Calcium, Magnesium, Zinc, Potassium) with operational status markers.
- **Interactive Galley RFID Meal Scanner (`RfidMealScanner.tsx`)**: Simulated space galley scanner where triggering an RFID nutrient pack (e.g. *Hydration & Electrolyte Mix Pack*, *High-Protein & Healthy Fats Stew*) immediately updates systemic caloric and protein reserves in real time.
- **24H Multi-Variate Timeline Chart (`Timeline24hChart.tsx`)**: Dual-axis spline chart correlating 24-hour Heart Rate trends against Glucose curves with meal ingestion pins.
- **2D BioScan Body Map (`BioScanBody.tsx`)**: Interactive human silhouette displaying glowing sensor nodes for neurological, respiratory, cardiac, metabolic, and muscular health.
- **IoT Bio-Link Gateway (`BioLinkView.tsx`)**: Mesh network manager monitoring 6 on-body and habitat IoT devices (Smartwatch, Hemodynamic BP Cuff, Bio-Patch Array, Continuous Glucose Monitor, RFID Meal Reader) with RSSI signal strength, battery levels, live telemetry payload streams, and secure PIN pairing.
- **Tele-Health & Emergency SOS (`MedicalConsultView.tsx`, `CallModal.tsx`)**: Private consultation channel between crew and flight surgeon with messaging, voice note audio playback, simulated encrypted video/audio calling, and a high-priority Emergency SOS broadcast.
- **OpenRouter AI Copilot with Resilient Edge Fallback**: Connects directly to OpenRouter free models via `/api/chat` and `/api/brief`. If upstream network connectivity is absent or API keys are unconfigured, it automatically falls back to an edge telemetry-grounded clinical synthesis based on the astronaut's real-time vitals snapshot.

---

## What this project does

Crew Health Monitor is a single-page dashboard that demonstrates a realistic split-of-concerns between a **hard-coded medical decision engine** and a **soft, advisory AI**:

- **Simulates** three crew members on a long-duration deep-space mission (each with HR, SpO₂, sleep, stress, 30-day radiation dose, dose rate, and injected scenario flags).
- **Advances a mission clock** (starts at Day 112, 06:00) on every tick.
- **Computes five medical rules** in the browser (Heart rate, Oxygen, Sleep, Stress, Radiation). Each rule produces a level: `0 = Stable`, `1 = Watch`, `2 = Alert`.
- **Computes a deterministic AI risk score** (0–100) in the browser. The score blends each rule's contribution, with an additive bonus when three or more factors are simultaneously elevated. The score is purely advisory and is never used to raise an alert.
- **Raises alerts** when a rule's level *increases* or when a previously-cleared rule re-enters alarm (with hysteresis). Each alert records the reading, the rule that fired, the threshold, the current AI score, and the timestamp.
- **Merges consecutive firings** of the same `(crew, rule)` into a single row, distinguishing **active** (the rule is still in alarm right now) from **cleared** (the rule returned to stable).
- **Generates a simulation brief** through the selected OpenRouter or local Ollama provider. The brief is structured as **Status / Active concerns / Suggested next step** and is explicitly not medical guidance.
- **Supports local inference** through a configurable Ollama URL and installed model. Briefs and chat stream directly from the browser to the local model; custom operator prompts cannot override the fixed alert and safety instructions.
- **Supports optional voice I/O** through configurable local Whisper STT and Piper or Qwen3 TTS endpoints.
- **Streams a visible chat** in its own Chat section so the user can discuss the crew snapshot or have casual conversations. OpenRouter health answers use a validated, server-rebuilt snapshot; local inference receives the app's deterministic snapshot directly.
- **Runs as an installable PWA** with the crew-monitor badge for browser, Android, and iPhone icons plus an install banner. The cached app shell keeps the simulation available offline; cloud inference requires connectivity, while local inference requires Ollama and its model to be running.
- **Compares crew readings** and records scenario changes and alert events in an inspectable mission timeline with replay actions.
- **Supports repeatable simulation runs** with immutable seeded ticks, cardiac/sleep/storm presets, pause, and one-tick stepping.
- **Stays responsive** across mobile, tablet, and desktop breakpoints with three distinct layouts, a 5-tab bottom nav on mobile that opens to Chat, and a single-viewport 3-column grid on desktop that opens to Ask assistant.

There is a **Run guided demo** button that automates a scripted 4-step scenario (cardiac strain → solar storm → rules fire → brief written).

### Prototype scope and future system vision

This repository is a **software prototype**: it simulates crew telemetry and
demonstrates local rules, optional local Ollama chat, configurable external
voice endpoints, and an offline-capable dashboard shell. It does **not**
currently read wearable/suit sensors or radio, detect a real solar storm, or
provide medically or operationally validated alerts.

The longer-term concept is a sensor-connected system that can continue local
monitoring without internet, using a local gateway, deterministic decision
rules, and an already-installed local model and voice stack. It may support
software-only simulation and hardware-plus-software deployments. The data flow,
sensor candidates, degraded-network behavior, safety boundaries, and staged
roadmap are documented in the **[System Vision](docs/system-vision.md)**.

---

## Core design principle: rules decide, AI advises

The point of this project is to show that an LLM should never be the authoritative source of a medical or safety decision. The architecture enforces that boundary in three places:

1. **Alerts are emitted by `evalRules()` only.** The AI score is computed in `aiScore()` and stored on the crew, but no function in `lib/simulation.ts` consults it to decide whether to fire an alert.
2. **The AI score can be disabled.** Toggling *AI offline* updates the dashboard, removes the score from the brief, and shows "Scorer offline" in the AI card — but the rules keep running and alerts keep firing. This is the safety property we want to demonstrate.
3. **Provider prompts forbid raising alerts.** The OpenRouter routes and local Ollama client provide instructions to use only the snapshot data and never invent alerts or contradict the rules engine. The brief format is constrained to a fixed 3-section markdown shape.

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

Run the dependency-free simulation and request-validation regression tests with `npm test`.

Without an OpenRouter key, the simulation, rules, AI score, and UI still work. Select and configure Local Ollama in Settings to use a model on your machine instead. OpenRouter provider configuration and upstream error details are not returned to the browser.

### Local Ollama and offline use

1. Install Ollama on the machine that will run inference and pull a model, for example `ollama pull <model-id>`.
2. Open **Settings → Local Ollama**, enter the Ollama URL (default `http://localhost:11434`), select **Test connection**, choose one of the returned models, and save.
3. Configure Ollama CORS for the exact origin hosting the page with `OLLAMA_ORIGINS`, then restart Ollama. For another device on a trusted LAN, Ollama must also bind to a LAN-reachable interface (for example `OLLAMA_HOST=0.0.0.0`) and the host firewall must allow the port. Do not expose unauthenticated Ollama to the public internet.
4. Install from the in-app banner or your browser menu while online, then load the dashboard once before disconnecting. On iPhone/iPad, open the site in Safari and use **Share → Add to Home Screen**. The cached app shell supports the local simulation and rule engine; it does not cache or install model weights.

Browser-to-Ollama inference intentionally requires no app proxy or database. Cross-origin requests must be permitted by Ollama. Browsers can block insecure HTTP requests to a LAN IP from an HTTPS-hosted dashboard; use localhost, serve the app on the local machine, or use a properly configured HTTPS endpoint. A browser cannot reach a model running on a different disconnected device unless that device remains reachable on the local network.

Preferences are stored in this browser's `localStorage`; conversation history and mission state are not persisted. Local settings are not sent to OpenRouter.

### Voice service contract

Voice services run separately from the Next.js app. Preferences default to the endpoints shown in the settings screenshot:

- STT: `POST http://localhost:5005/transcribe` with multipart `file` and optional `model`; return JSON `{ "text": "..." }` or plain text.
- TTS: `POST http://localhost:5006/speak` with JSON fields `text`, `input`, `model`, `voice`, and `response_format`; return raw audio bytes with an `audio/*` or `application/octet-stream` content type.

The STT endpoint is intended for a local Whisper service; the TTS engine, model, voice, and endpoint can be configured for Piper or Qwen3 TTS. The configured service must allow browser CORS. This repository does not include those model runtimes or a `voice_server.py`; the endpoint processes must be installed and started separately. Microphone permission is requested only when the user presses **Mic**, and recordings are capped at 60 seconds.

---

## Deployment to Vercel

1. Push this folder to a new GitHub repo.
2. Import the repo at <https://vercel.com/new>.
3. If you want OpenRouter, go to **Settings → Environment Variables** and add:
   - `OPENROUTER_API_KEY` = your key from <https://openrouter.ai/keys>
   Local Ollama mode does not require this key.
4. Deploy.

`vercel.json` pins the deploy region to `iad1`, sets the framework to `nextjs`, and disables Next telemetry. The key is only read inside `app/api/*/route.ts` and is never shipped to the browser.

---

## The crew and the simulation model

`lib/simulation.ts` creates three crew members and advances them using immutable, seeded ticks. Each tick returns fresh crew state and the next seed, so snapshots can be replayed without mutating previous state.

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
- **30-day dose**: `dose += rate · 0.5` per tick (each tick represents 30 minutes of mission time).

A 60-sample rolling history is kept per metric (`crew.H.hr`, `crew.H.spo2`, etc.) for sparkline and rule evaluation.

The mission clock (`clock()`) is also driven by ticks. `clock(tick) = "Day 112 + …  · HH:MM"`. Each tick represents 30 minutes of mission time. At the default one tick per second, the guided demo's first 38 ticks represent roughly 19 hours of simulated mission time.

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

`lib/openrouter.ts` is the server-only module that talks to OpenRouter. It implements a **free-model cascade** so the app degrades gracefully when one provider is down, rate-limited, or empty without selecting paid models.

### The cascade

On first use, `loadCascade()` fetches `https://openrouter.ai/api/v1/models` (no auth required). It filters to chat-capable models (`output_modalities` includes `text`, or `modality` contains `text` / `->text`) whose prompt **and** completion prices are both exactly zero, then keeps the top 5. Paid models and entries with missing or invalid prices are excluded; if no free text models are listed, the request fails rather than using a paid model. Remaining free models are ranked by:

1. **Context**: +100 if `context_length ≥ 32 000`.
2. **Family preference**: +50 if the id contains one of `llama`, `qwen`, `gemini`, `deepseek`, `glm`, `mistral`, `claude`, `gpt`, or `command`.

The top **5 free** ids are cached in module-scope memory for 10 minutes, with an inflight de-dup so concurrent first-uses don't fire two requests. Every API route then iterates those ids in order:

- **Non-streaming** (`callCascade`): 8 s per model, 600 max tokens default, `temperature ≈ 0.4`.
- **Streaming** (`streamCascade`): 16 s per model, 800 max tokens default, `temperature ≈ 0.5`.

On `401`/`403` the cascade aborts immediately — the key is bad, retrying won't help. On other failures it tries the next model. Chat streaming also treats upstream SSE errors, empty replies, and incomplete streams as failures instead of reporting an empty success. Vercel function logs record the model and a sanitized failure category (and HTTP status when available), but never log credentials, prompts, or provider response bodies. Successful chat logs show `[openrouter] stream completed by: <id>`; non-streaming calls show `[openrouter] served by: <id>`.

### `/api/brief` (POST, non-streaming)

`app/api/brief/route.ts`. Request body: `{ crew: Crew, aiOn: boolean }`, limited to 24 KiB. The route validates metric bounds, rebuilds canonical crew identity and rule evidence, then builds a deterministic text snapshot. When the scorer is offline, its score and factor contributions are omitted from the model context. The system prompt fixes the output shape to three sections — **Status** / **Active concerns** / **Suggested next step** — and forbids diagnosis, treatment advice, and new alerts. Response: `{ text, model }`. Invalid requests return 400, oversized requests return 413, and upstream failures return a generic 503.

### `/api/chat` (POST, streaming)

`app/api/chat/route.ts`. Request body: `{ crew, aiOn, alerts, messages }`, limited to 64 KiB, 20 transcript messages, and 1,200 characters per message. The route rebuilds canonical crew identity/rule evidence, omits scorer data when offline, keeps only bounded structured alert references, and always prepends the resulting snapshot as a first user message and a fixed assistant acknowledgement ("Understood. I have the snapshot. What would you like to know?"), then appends the validated transcript. It opens a `ReadableStream` of `text/event-stream` chunks. Each upstream SSE `data:` line is re-emitted as a client-friendly JSON chunk:

```
data: {"delta":"<text>","model":"<id>"}
data: [DONE]
```

The client (`sendChat` in `app/page.tsx`) reads the stream with a `ReadableStreamDefaultReader`, decodes chunks, parses each `data:` line, dispatches `ADD_CHAT_DELTA` to the reducer, and finalizes the model on `[DONE]`. Client disconnects cancel upstream generation. If generation fails, the submitted user message remains visible and the UI shows a generic error; the HTTP response can still be 200 because the failure is reported inside the SSE stream. Routes never return provider error text. These request bounds are not a substitute for persistent per-user rate limiting; add an appropriate backend rate-limit store before exposing paid model access publicly.

Both routes are `runtime = "nodejs"` and `dynamic = "force-dynamic"` because they read the API key from the environment on every request.

---

## Data flow end-to-end

1. **Boot** — `app/page.tsx` calls `mkCrew(0|1|2)` for three crew members and runs `stepSim` 60 times to warm the rolling histories, so the sparklines aren't empty on first paint.
2. **Tick** — A `setInterval` (period = `1000 / speed`, where `speed ∈ {1, 2, 4}`) dispatches `ADVANCE`. For each crew member `stepSim(crew, opts, seed)` returns updated vitals, the recomputed AI score, evaluated rules, generated alerts, and a new seed without mutating the prior snapshot. New alerts are prepended into the page state; alerts and timeline events have fixed retention caps.
3. **Display** — Each card reads from `state.crew[state.selected]`. The `Pipeline` strip animates the colored top-border per step; clicking a step briefly highlights the corresponding panel on screen (via `stageClass(n)`).
4. **Inject** — The user toggles a scenario flag (sleep, cardiac, storm, AI on/off). The reducer creates a new state snapshot with the global flag or selected crew member's `f` value; the next tick reflects the change.
5. **Brief** — Clicking **Write brief** uses either the `/api/brief` OpenRouter route or streams directly from the configured Ollama host. The brief renders with a minimal Markdown parser (`Md` in `BriefCard.tsx`) that handles headings and bullets.
6. **Chat** — OpenRouter chat POSTs the latest bounded transcript to `/api/chat` and consumes its SSE stream; local chat consumes Ollama NDJSON directly from the browser. Each delta is appended to the last assistant message in the reducer.

---

## Architecture and folder layout

```
nasa-space-app/
├─ app/                         # Next.js 15 App Router
│  ├─ layout.tsx                # Root layout. Loads Inter + JetBrains Mono, wraps in MotionConfig.
│  ├─ globals.css               # Responsive root font, body gradient, focus ring, scrollbar.
│  ├─ page.tsx                  # The dashboard. useReducer + tick loop. The whole app's brain.
│  ├─ public/manifest.webmanifest / sw.js # Installable shell and offline caching.
│  └─ api/
│     ├─ brief/route.ts         # Non-streaming LLM brief.
│     └─ chat/route.ts          # Streaming LLM chat over SSE.
│
├─ components/
│  ├─ astroguard/               # AstroGuard multi-tenant space-health suite
│  │  ├─ LoginPage.tsx          # Full-screen auth gateway with 5 exposed 1-click profiles
│  │  ├─ AstronautPortal.tsx    # Astronaut console (collapsible nav, vitals, consult, copilot)
│  │  ├─ DoctorHub.tsx          # Flight surgeon operations hub (triage feed, ECG, calls, fleet)
│  │  ├─ ECGMonitor.tsx         # Canvas Lead-II waveform monitor (HR synchronized, PR/QRS/QTc)
│  │  ├─ MacroGauges.tsx        # Circular progress rings (Protein, Fats, Fiber, Water, Energy)
│  │  ├─ MicroArrayAssay.tsx    # Spectrometry biomarker profiling (Vitamins A-K, Minerals)
│  │  ├─ RfidMealScanner.tsx    # Interactive galley meal reader with real-time reserve sync
│  │  ├─ Timeline24hChart.tsx   # 24H dual-axis spline chart (HR vs. Glucose + meal pins)
│  │  ├─ BioScanBody.tsx        # 2D wireframe human body silhouette with glowing organ nodes
│  │  ├─ BioLinkView.tsx        # BLE/USB IoT mesh device gateway manager (RSSI & battery)
│  │  ├─ MedicalConsultView.tsx # Tele-health messaging, audio notes & Emergency SOS dispatch
│  │  ├─ CallModal.tsx          # Simulated encrypted video/audio tele-presence modal
│  │  └─ AuthModal.tsx          # Credentials inspection & login modal
│  ├─ TopBar.tsx                # Title, clock, scenarios, AI toggle, play/pause, Sign Out.
│  ├─ Pipeline.tsx              # 6-step strip (Simulate → Baseline → AI score → Rules → Alert → Brief).
│  ├─ CrewList.tsx              # 3 layout variants: pills (sm), row (md), rail (lg+).
│  ├─ VitalsCard.tsx            # 5 tiles: HR, SpO₂, Sleep, Stress, Radiation (sparklines + progress bars).
│  ├─ AIScoreCard.tsx           # Big animated score, per-factor bars, "advisory" tone.
│  ├─ RulesCard.tsx             # The 5 rules with current value, threshold, and "decides" tone.
│  ├─ AlertsCard.tsx            # Active + cleared merged-alert rows, collapsible cleared list.
│  ├─ TraceCard.tsx             # "Why did this alert fire?" 5-line decision trace.
│  ├─ MissionTimeline.tsx      # Recent alert/scenario events with inspect and replay actions.
│  ├─ CrewComparison.tsx        # Cross-crew synthetic-reading comparison.
│  ├─ BriefCard.tsx             # Markdown-rendered simulation brief.
│  ├─ AskCard.tsx               # Visible assistant conversation and message input.
│  ├─ SettingsPanel.tsx         # Ollama, Whisper, Piper, and Qwen3 endpoint preferences.
│  ├─ TabbedPanel.tsx           # Desktop/tablet container with Alerts / Why / Brief / Ask assistant tabs.
│  ├─ BottomTabs.tsx            # Mobile bottom tab bar (Vitals / Alerts / AI & rules / Brief / Chat).
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
│  ├─ llmInput.ts               # Bounded JSON parsing and server-side snapshot validation.
│  ├─ chatPrompt.ts             # Chat behavior rules and snapshot-grounded conversation context.
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

The layout adapts between a compact, section-switched experience and a multi-panel dashboard:

| Breakpoint | Class | Layout                                                                                                    |
|------------|-------|-----------------------------------------------------------------------------------------------------------|
| `< 1280px` | compact | One section at a time, switched by **BottomTabs**, opening on Chat. Short viewports scroll naturally; scenarios open in **ScenarioSheet**. |
| `≥ 1280px` | dashboard | Four visible columns: **crew + scenarios** \| **vitals, crew comparison, AI score + rules** \| **alerts, alert explanation + brief** \| **chat**. The page scrolls on shorter viewports rather than clipping the dashboard. |

The top **Pipeline** strip is always visible. Clicking a step briefly highlights the corresponding dashboard panel on screen with a `ring-accent` ring for ~2.2 s, so a presenter can walk a viewer through the six steps in order.

`BottomTabs` provides **Vitals / Alerts / AI & rules / Brief / Chat** on compact screens, with an animated underline and an alerts badge. On wide screens these dashboard surfaces stay visible together, including the conversation and its input.

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
- **LLM**: OpenRouter server-side cascade or browser-direct Ollama `/api/chat`
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
- **Local mode**: the browser calls the configured Ollama `/api/tags` and `/api/chat` endpoints directly. It does not go through Vercel. Ollama must allow the page origin, and the model must already be downloaded.
- **Resetting**: `Reset` clears scenario flags, alerts, the brief, the chat, and rebuilds the crew. The mission clock goes back to `Day 112, 06:00`.
- **Persistence**: provider and voice preferences are kept in browser `localStorage`; conversation history and mission state are not persisted. Refreshing starts a fresh mission.

---

## Limitations and design choices

- **Simulation is a model, not data.** The crew are stylized agents, not real astronauts. Vitals are tuned so the demo can show off every rule in under a minute. Thresholds (HR +30%/+50%, SpO₂ 94/90, sleep 5.5/4.5, stress 75/90, dose 80/95) match the rule file verbatim.
- **The AI score is intentionally trivial.** A weighted blend of normalized factors plus a 3-factor bonus. It exists to demonstrate the *separation* of scoring and alerting, not to be a clinical model.
- **No authentication.** The dashboard is a demo. There is no user account, no per-crew persistence, no historical data export.
- **Local inference depends on the browser and local services.** It is not routed through the server, settings are per-browser, and Ollama/voice endpoints need compatible CORS configuration. A deployed HTTPS page may not be able to call an insecure HTTP LAN address.
- **Voice runtimes are external.** This app calls configurable endpoints but does not install Whisper, Piper, Qwen3 TTS, or ship a voice server.
- **Cascade is rank-based, not round-robin.** If a paid model is highly ranked it will keep winning; if a free model is highly ranked it will keep being tried first. This is the intended behavior for a NASA-style demo on a small budget.
- **The "Why" trace is shown, not generated.** `TraceCard` reads the rule that fired and lays out a fixed 5-line decision record. The LLM never writes this — it is always derived from the rule result and the AI score at firing time.

---

## License

This project was built for the NASA Space Apps Challenge. No license is bundled; treat the source as MIT-licensed for the purposes of review and reuse, unless a `LICENSE` file is added by the maintainer.
