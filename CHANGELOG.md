# Changelog

All notable changes to this project. Newest first.

The format is loosely [Keep a Changelog](https://keepachangelog.com/),
with the addition of an **AI-agent-handoff** section per release
that calls out things an AI coding assistant should know.

## [Unreleased]

## 2026-11-13 — AstroGuard Multi-Role Expansion & Tele-Health Operations Platform

### Summary
Comprehensive architectural expansion transforming the Crew Health Monitor prototype
into the full **AstroGuard: Autonomous Crew Health & Tele-Health Operations Platform**.
Introduces 5 authenticated multi-tenant consoles with strict privacy isolation, real-time
Lead-II ECG canvas monitoring, metabolic and biomarker profiling, RFID space-meal intake
tracking, IoT Bio-Link mesh management, and clinical triage with encrypted audio/video calling.

### Added
- **Multi-Role Authentication Gateway** (`components/astroguard/LoginPage.tsx`):
  - 5 exposed 1-click evaluation profiles:
    - `crew-0`: Commander Amara Okafor (`amara@ares.nasa.gov`)
    - `crew-1`: Dr. Lin Zhao (`lin@ares.nasa.gov`)
    - `crew-2`: Engineer Rafi Ahmed (`rafi@ares.nasa.gov`)
    - `doctor`: Dr. Evelyn Vance (`doctor@ares.nasa.gov`)
    - `admin`: Flight Operations Director (`flight@ares.nasa.gov`)
  - Direct role-based authentication with form entry and 1-click loading.
- **Dedicated Astronaut Portals** (`components/astroguard/AstronautPortal.tsx`):
  - Collapsible sticky sidebar navigation (`w-72` to `w-20` icon rail) eliminating dead space on long scrolls.
  - Live Lead-II ECG Canvas waveform generator with dynamic heart-rate synchronization (`ECGMonitor.tsx`).
  - Macro & Metabolic Energy HUD with circular SVG progress rings and basal metabolic reserve bar (`MacroGauges.tsx`).
  - Micro-Array Biomarker Assay tracking 6 key vitamins and 5 essential minerals (`MicroArrayAssay.tsx`).
  - Interactive RFID Space-Meal Scanner syncing galley food packs to metabolic reserves (`RfidMealScanner.tsx`).
  - 24H Timeline Spline Chart correlating Heart Rate and Glucose with meal ingestion markers (`Timeline24hChart.tsx`).
  - 2D BioScan Wireframe Body Map with pulsing organ status nodes (`BioScanBody.tsx`).
  - Bio-Link IoT Wearables Manager with BLE/USB signal RSSI, battery levels, live telemetry payload streams, and PIN pairing modal (`BioLinkView.tsx`).
  - Encrypted Doctor Tele-Health channel with private messaging, audio notes, and simulated audio/video uplink (`MedicalConsultView.tsx`, `CallModal.tsx`).
  - Critical Emergency SOS dispatch button broadcasting immediate clinical alerts to flight surgeon.
  - Integrated AI Health Copilot utilizing OpenRouter `/api/chat` and `/api/brief` with intelligent physiological fallback when offline.
  - Viewport-safe medical notification bell with transmission alerts.
- **Dedicated Flight Surgeon Operations Hub** (`components/astroguard/DoctorHub.tsx`):
  - Clinical Triage & Anomaly feed with real-time severity badges (`Critical`, `Warning`, `Nominal`).
  - Interactive Assigned Astronaut Roster with 1-click patient scoping and vital summaries.
  - Live high-resolution ECG canvas monitor with rhythm diagnosis.
  - Triage response actions: `Voice Call`, `Video Uplink`, and `Flag to Mission Control`.
  - Viewport-safe notification center with unread message and SOS incident dropdown.
  - Biometric fleet status oversight for all paired IoT wearables.
- **Mission Control Admin Dashboard**:
  - Seamless integration of original 3-crew fleet overview with deterministic 5-rule engine, AI risk scoring, and top-bar sign-out button.
- **New Types & Data Structures** (`lib/astroGuardTypes.ts`, `lib/astroGuardData.ts`):
  - Comprehensive type definitions for `AstroRole`, `AstroUser`, `IoTSensorDevice`, `ConsultMessage`, `TriageIncident`, and `NutritionItem`.
- **Vitest Test Suite** (`lib/astroGuard.test.ts`):
  - 4 automated unit tests verifying credential integrity, multi-tenant isolation, doctor unread counts, and IoT device configuration.
  - Total test count expanded to **56 passing tests** (38 Vitest + 18 Node).

### Changed
- `app/page.tsx`: Role-based route rendering, per-crew AI Copilot scoping, and resilient fallback handling.
- `components/TopBar.tsx`: Added direct `Sign Out [→` button returning back to the gateway.
- Clean space-grade UI: Replaced all colorful emojis with NASA-grade SVG icons, status badges, and monogram rings.
- Notification dropdown positioning: Fixed viewport cutoff with `fixed sm:absolute inset-x-4 sm:inset-x-auto sm:right-0 top-20 sm:top-12 z-50`.

## 2026-10-14 — `ab82111` — Specific cascade errors instead of generic warning

### Summary
Brief and chat failures now surface **specific, actionable error
messages** instead of a generic "could not be generated". Operators
gain two new env vars to make the cascade more resilient when
OpenRouter's free catalog is sparse.

### Changed
- `lib/openrouter.ts` — `callCascade` and `streamCascade` now throw
  a typed `CascadeError` with a `kind` discriminator instead of a
  generic `Error`. Kinds: `missing_api_key`, `auth`, `no_models`,
  `catalog_unavailable`, `all_failed`.
- `app/api/brief/route.ts` — maps each `CascadeError.kind` to a
  specific `{code, error}` response. Auth → 502; everything else →
  503.
- `app/api/chat/route.ts` — same mapping for the SSE error frame.
- `app/page.tsx` — parses the `code` and shows a specific message
  keyed on the code; generic message is the fallback.

### Added
- `OPENROUTER_MAX_PRICE_PER_1K` env var. `0` (default) keeps the
  strict "both prompt and completion must be 0" filter. A positive
  USD value (e.g. `0.0001`) widens the cascade to include models
  priced at or below that cap.
- `OPENROUTER_MODEL` env var. When set, the cascade pins a single
  model id and skips the catalog entirely.
- `lib/aiScoreColor.ts` (added in `80302ff`) — display-only color
  thresholds for the AI risk score (green < 40, yellow ≤ 70, red >
  70). Distinct from `band()` in `lib/aiScore.ts` which the LLM
  sees.

### Tests
- 4 new tests in `tests/simulation.test.cjs`:
  - `OPENROUTER_MAX_PRICE_PER_1K` widens the cascade.
  - `OPENROUTER_MODEL` bypasses the catalog.
  - `callCascade` raises typed `auth` on 401/403.
  - `callCascade` raises typed `missing_api_key` when the env
    var is unset.
- Existing tests updated to assert on `CascadeError.kind` instead
  of error message regex.

### AI-agent-handoff
- The cascade no longer has a "silent fall through" failure mode.
  Every failure now has a specific `code` value that the UI
  surfaces. If you change the cascade, preserve this contract.
- The free catalog is sparse (effectively one model today). The
  `OPENROUTER_MAX_PRICE_PER_1K` and `OPENROUTER_MODEL` env vars
  are the operator's escape hatch.

## 2026-10-13 — `80302ff` — Spec-driven responsive desktop refactor

### Summary
Desktop dashboard rebuilt to the user's full design spec. No
behavior change, no LLM/API change. All UI tuning.

### Changed
- 3-column grid: `25% / 1fr / 25%` with 32 px column gap.
- Vitals panel: 24 px padding; tiles 20 px padding.
- Vital numbers: `clamp(2.5rem, 2vw + 1.5rem, 3rem)` in
  monospace tabular-nums.
- Sparklines: 3 px stroke, 64 px chart height.
- Crew rail cards: 120 px min-height, sparkline below text in
  dedicated 40 px flex child.
- Bottom panel: 32 px margin-top, 48 px tabs, 250 px min content
  area.

### Added
- `components/ui/BarChart.tsx` — smooth inline-SVG line chart
  replacing the blocky sleep histogram.
- `lib/aiScoreColor.ts` — display-only AI score color thresholds.
- 6 new spec-driven layout checks in
  `scripts/check_desktop_layout.py`, enforced at viewports
  ≥ 800 px tall.

### Removed
- `components/SleepDebtBar.tsx` — replaced by `BarChart`.

### AI-agent-handoff
- The sleep tile is a smooth line chart, not a histogram. If you
  need a bar chart, the right primitive is `BarChart` configured
  for the use case, not a resurrection of `SleepDebtBar`.
- The AI score color thresholds are **display-only**. Changing
  `band()` in `lib/aiScore.ts` would change what the LLM sees;
  don't do that without coordinating.

## 2026-10-13 — `fdb4ab2` — Un-break the dashboard after the visualization upgrade

### Summary
Reverted the worst offenders from the visualization upgrade in
`1eb0152` to restore readability.

### Changed
- Radar chart and dose gauge removed.
- Sparkline retention bumped to a more readable default.

## 2026-10-12 — `1eb0152` — Visualization upgrade

### Added
- Sparklines, radar, dose gauge, Gantt timeline, traffic-light
  colors across the dashboard.

### Notes
- Later partially reverted in `fdb4ab2`.

## Earlier history

See `git log --oneline` for the full history prior to the
visualization upgrade.
