# Changelog

All notable changes to this project. Newest first.

The format is loosely [Keep a Changelog](https://keepachangelog.com/),
with the addition of an **AI-agent-handoff** section per release
that calls out things an AI coding assistant should know.

## [Unreleased]

### Added
- `AGENTS.md` — focused handoff doc for AI coding assistants. Read
  this first; `README.md` is the product doc, `AUDIT.md` is the
  original audit, this is the "what do I need to know to be
  useful" doc.
- `CHANGELOG.md` — this file.

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
