# AGENTS.md — Handoff for AI coding assistants

> **Read this first.** This is a focused handoff document for future AI
> agents working on this repo. The full product README is
> [`README.md`](./README.md) and the original audit is
> [`AUDIT.md`](./AUDIT.md). This file is about **what you, the agent,
> need to know to be useful and not destructive**.

## What this project is

**Crew Health Monitor** — a Next.js 15 single-page dashboard for the
NASA Space Apps Challenge. It simulates three crew members' vitals,
runs a deterministic 5-rule medical alert engine in the browser, and
asks an LLM (via OpenRouter) to write a structured brief and chat
about the synthetic snapshot.

Live: <https://crew-health-monitoring.vercel.app/>

**The non-negotiable architectural contract:** *rules decide, AI
advises.* The deterministic rules engine in `lib/rules.ts` is the only
authority on alerts. The AI score (`lib/aiScore.ts`) is purely
advisory and must never influence alert emission. This contract is
documented and tested — do not weaken it.

## Tech stack (pinned)

| Layer | Version | Notes |
| --- | --- | --- |
| Next.js | 15.0.3 | App Router, Node runtime |
| React | 19.0.0-rc | |
| TypeScript | 5.6 | strict, `moduleResolution: "bundler"` |
| Tailwind | 3.4 | small custom token system |
| framer-motion | 11.11 | all motion, gated by `prefers-reduced-motion` |
| recharts | 2.13 | Sparkline only |
| Vitest | 2.1 | `lib/**/*.test.ts` |
| Node test | built-in | `tests/simulation.test.cjs` |
| OpenRouter | — | free-tier cascade, server-only |

## Folder layout (the mental model)

```
app/
  layout.tsx           # Inter + JetBrains Mono fonts, MotionConfig
  page.tsx             # THE BRAIN. useReducer + tick loop + network calls
  globals.css          # all the .desktop-* responsive rules
  api/brief/route.ts   # non-streaming LLM brief, max 24 KiB
  api/chat/route.ts    # streaming LLM chat over SSE, max 64 KiB

components/            # one file per panel/control
  ui/                  # tiny design system: Panel, Button, Sparkline,
                       #   ProgressBar, BarChart (smooth sleep line)

hooks/                 # useMediaQuery, useStickyScroll

lib/
  types.ts             # Crew, Alert, RuleResult, VitalsHistory, ChatMessage
  simulation.ts        # mkCrew, step (the tick), clock — seeded, immutable
  rules.ts             # evalRules(c) → 5 RuleResult rows (the AUTHORITY)
  aiScore.ts           # aiScore(c) + band() — DETERMINISTIC, ADVISORY ONLY
  alertMerge.ts        # mergeAlerts — groups consecutive firings
  serialize.ts         # snapshotForLLM — the prompt payload
  llmInput.ts          # bounded JSON + server-side snapshot validation
  chatPrompt.ts        # chat behavior rules
  openrouter.ts        # CascadeError + callCascade + streamCascade
  colors.ts            # level → color
  cn.ts                # clsx + tailwind-merge

tests/simulation.test.cjs  # Node --test (integration-ish, mocks fetch)

scripts/check_desktop_layout.py  # Playwright layout regression
```

## What just changed (last 2 commits, Oct 2026)

### `80302ff` — Spec-driven responsive desktop refactor
UI-only refactor, no behavior change. Detailed plan in the prior
session. Highlights:

- 3-column grid: `25% / 1fr / 25%` with 32 px column gap (was 12 px).
- Vitals panel: 24 px padding, tiles 20 px padding.
- Vital numbers: `clamp(2.5rem, 2vw + 1.5rem, 3rem)`, monospace
  tabular-nums (was ~28 px proportional).
- Sparklines: 3 px stroke, 64 px chart height (was 2 px / 48 px).
- Crew rail cards: 120 px min-height, sparkline **below** the text
  in a dedicated 40 px flex child.
- Bottom panel: 32 px margin-top from vitals, 48 px tabs, 250 px
  min content area.
- Sleep tile: blocky histogram replaced with a smooth inline-SVG
  line chart in `components/ui/BarChart.tsx`.
- Radiation tile: 16 px progress bar with "80%" and "95%" threshold
  tick labels.
- AI score color thresholds are **display-only** in
  `lib/aiScoreColor.ts`: green < 40, yellow ≤ 70, red > 70. The
  underlying `band()` in `lib/aiScore.ts` stays at < 30 / < 60
  because the LLM snapshot uses those exact strings.
- Layout verifier (`scripts/check_desktop_layout.py`) gained 6 new
  spec-driven checks enforced at viewports ≥ 800 px tall.

### `ab82111` — Specific cascade errors instead of generic warning
**This is the important one for the brief/chat feature.**

Root cause: OpenRouter's free-tier catalog now has effectively one
chat model (`apodex/apodex-1.1-mini:free`). When that one model is
unavailable, the cascade threw a generic `Error` which surfaced as
the user-facing "The brief could not be generated" with no signal
about why.

Fix:

- `lib/openrouter.ts` now exports a typed `CascadeError` with a `kind`
  discriminator: `missing_api_key | auth | no_models |
  catalog_unavailable | all_failed`.
- New env vars (both optional, default = current behavior):
  - `OPENROUTER_MAX_PRICE_PER_1K` — widens the cascade to near-free
    models (e.g. `0.0001` to include models up to 10¢/1M tokens).
    Default `0` keeps the strict "both = 0" filter.
  - `OPENROUTER_MODEL` — pins a single model id and skips the
    catalog entirely.
- `app/api/brief/route.ts` and `app/api/chat/route.ts` map each
  `CascadeError.kind` to a specific `{code, error}` response and
  HTTP status. Auth → 502. Everything else → 503 with a code.
- `app/page.tsx` parses the `code` and shows a specific user-facing
  message keyed on the code. The generic message remains the
  fallback for unknown failures.
- 4 new tests in `tests/simulation.test.cjs` cover the new behavior
  (price cap, model pin, auth error, missing key).

## How to test

```bash
npm run test        # 25 vitest + 18 node tests
npm run build       # next build (also type-checks)
python3 scripts/check_desktop_layout.py   # Playwright layout, needs dev server
```

The layout verifier expects `http://127.0.0.1:3000` and a running
dev server (`npm run dev`). Viewports: 1280×709, 1280×800,
1470×830, 1470×956, 1920×1080.

## How to debug the cascade

The cascade logs are structured JSON to make grep easy:

```bash
# In Vercel function logs or `npm run dev` stdout:
[openrouter] served by: <model>          # success
[openrouter] stream completed by: <model> # stream success
[openrouter] model failed <model> <status>
[openrouter] stream attempt failed { model, category, status? }
[openrouter] request configuration failed { category: "missing_api_key" }
[openrouter] no allowed models in catalog { cap }
[/api/brief] upstream auth failed { message }
[/api/brief] no models in cascade { message }
[/api/brief] all cascade models failed
[/api/chat]  upstream service failed <Error>
```

The categories you'll see for stream failures: `timeout`,
`upstream_sse_error`, `malformed_sse`, `incomplete_stream`,
`empty_stream`, `authentication`, `http_error`,
`missing_response_body`, `network_or_stream_error`.

## The trust model (read this before touching routes)

1. **The server rebuilds the crew snapshot from bounded metrics.**
   `parseCrewSnapshot` discards client-supplied `n`, `role`, `R`,
   `r`, `ai`, `F`, `armed` and rebuilds them from `mkCrew` +
   `evalRules` + `aiScore`. A client cannot impersonate a crew
   member or inject false rule evidence.
2. **The server strips client assistant turns.** In
   `app/api/chat/route.ts`, `messages` is filtered to
   `role: "user"` only. A client cannot seed prior assistant turns
   to make the LLM follow them.
3. **Alert prose is re-derived from rules.** `sanitizeAlertHistory`
   ignores client `n`, `th`, `why`, `lv` and rebuilds them from the
   validated crew's rule results. Timestamp is regex-validated.
4. **System prompts forbid raising alerts.** Both `/api/brief` and
   `/api/chat` ship system prompts that explicitly tell the model
   to use only the snapshot and never invent alerts.
5. **Cascade is strictly free by default.** `OPENROUTER_MAX_PRICE_PER_1K=0`
   means "both prompt and completion prices must be 0". Anything
   with unparseable pricing is also rejected. Setting a positive
   cap widens this; setting `OPENROUTER_MODEL` overrides entirely.

**Do not add a code path that lets the LLM raise alerts, or that
trusts client-supplied identity, alert prose, or prior assistant
turns.**

## Things agents commonly get wrong here

- **Don't change the rule thresholds without updating tests.**
  Every threshold has a boundary test in `lib/rules.test.ts`. The
  thresholds are calibrated so the guided demo hits every rule
  within a minute.
- **Don't add new colors.** The traffic-light system is `ok` /
  `watch` / `bad` from `lib/colors.ts`. The 3-color system is
  load-bearing for the "rules decide" pattern.
- **Don't move the sleep chart back to bars.** `BarChart` is the
  current contract. The histogram (`SleepDebtBar`) was deleted.
- **Don't bypass `parseCrewSnapshot`.** The whole point of the
  server-side rebuild is that the LLM never sees client prose.
  If you find yourself wanting to forward a field as-is, you
  almost certainly want to add it to the rebuild instead.
- **Don't add new `useEffect`s to `app/page.tsx` that depend on
  `state.crew`.** The 60-tick pre-warm and the tick interval
  re-bind already; adding more will cause tick thrash.
- **The AI score colors are display-only.** If you change
  `aiScoreDisplayColor`, also change the corresponding test in
  the layout verifier. If you change `band()` in `lib/aiScore.ts`,
  you change what the LLM sees — discuss with the user first.
- **The simulation is tuned for the demo.** `step()` damping
  values are chosen so the cardiac flag produces a Watch within
  ~2 ticks and the storm flag produces a Radiation Watch on the
  first tick. Don't "fix" this.

## What "done" means

- `npm run build` is clean (zero TS/ESLint errors).
- `npm run test` passes (25 vitest + 18 node).
- For layout changes: `python3 scripts/check_desktop_layout.py`
  passes at all five viewports.
- For LLM changes: hit `/api/brief` and `/api/chat` with a real
  payload (use the dev server) and verify the response shape
  matches the typed contracts in `app/api/*/route.ts`.
- For state changes: confirm the page still works on mobile
  (BottomTabs), tablet, and desktop (3-column grid).
- For trust-model changes: the four guarantees in the section
  above must still hold. Add a regression test if you weaken
  any of them.

## If you need a quick orientation

1. Read this file.
2. Read `README.md` for product/architecture.
3. Read `AUDIT.md` for the original audit (still mostly accurate).
4. `git log --oneline -20` to see recent history.
5. Skim `lib/simulation.ts` and `lib/rules.ts` to see the
   authoritative logic.
6. Skim `app/page.tsx` to see how it all wires together.
7. Skim `app/api/chat/route.ts` and `lib/openrouter.ts` before
   touching anything that talks to the LLM.

## Difficulties and known sharp edges

- **Free OpenRouter catalog is sparse.** Today there is
  effectively one free chat model. When it fails, the cascade
  falls through to "all_failed" → 503. The user now sees a
  specific message instead of a generic one, but the model may
  still be down. The fix: set `OPENROUTER_MODEL` to a specific
  model id and add credits, OR set `OPENROUTER_MAX_PRICE_PER_1K`
  to allow near-free paid models.
- **`/api/chat` returns 200 even on upstream failure.** The error
  is in the SSE body (`data: {"error": "...", "code": "..."}`).
  This is intentional so the client can still receive deltas
  before the failure, but it means a 200 response is not a
  success indicator. Check the `code` field or the
  `[DONE]`/`error` frames.
- **The Vercel function region is `iad1`.** Cold-starts there are
  the dominant latency. The first LLM call after deploy fetches
  the model catalog (~1 request) and then tries the top model.
  Subsequent calls within 10 minutes reuse the cache.
- **`http://localhost:3000` vs `127.0.0.1:3000`.** The Playwright
  verifier hard-codes `127.0.0.1`. Use that, not `localhost`.
- **The `.env.local.example` was previously committed with a real
  key by mistake.** That has been restored to a placeholder; do
  not commit real keys.
- **`HTTP-Referer` is hard-coded to
  `https://crew-health-monitor.vercel.app`** in `lib/openrouter.ts`.
  The actual deployed URL is
  `https://crew-health-monitoring.vercel.app/`. Cosmetic only;
  OpenRouter uses it for analytics, not auth.
