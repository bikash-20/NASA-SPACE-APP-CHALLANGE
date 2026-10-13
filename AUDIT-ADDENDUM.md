# Audit addendum — current state

This is an addendum to [`AUDIT.md`](./AUDIT.md) (the original audit
from 2026-10-13). It covers the two commits that landed after the
original audit:

| Commit | Date | What |
| --- | --- | --- |
| `80302ff` | 2026-10-13 | Spec-driven responsive desktop refactor (UI only) |
| `ab82111` | 2026-10-14 | Specific cascade errors instead of generic warning (LLM) |

The original `AUDIT.md` is still accurate for the parts of the code
it covered. This file only documents what changed.

## Updated headline numbers

| Metric | Before addendum | After addendum |
| --- | --- | --- |
| Test count | 23 vitest + 14 node | 25 vitest + 18 node |
| Bundle size (dashboard route) | 177 kB / 280 kB First Load | 178 kB / 280 kB First Load |
| Cascade error modes | 1 (generic `Error`) | 5 typed `CascadeError` kinds |
| User-facing error messages on brief/chat failure | 1 (generic) | 6 (5 specific + 1 generic fallback) |
| Cascade env vars | 1 (`OPENROUTER_API_KEY`) | 3 (`OPENROUTER_API_KEY`, `OPENROUTER_MAX_PRICE_PER_1K`, `OPENROUTER_MODEL`) |

Build is clean. All tests pass. The audit's "Ship it" verdict is
unchanged.

## What `80302ff` changed

Pure UI refactor. No behavior change, no LLM/API change. Highlights:

- 3-column desktop grid `25% / 1fr / 25%` with 32 px column gap
  (was `minmax(260px, 25%) minmax(0, 1fr) minmax(280px, 25%)` with
  12 px gap).
- Vitals panel padding bumped to 24 px; tile padding to 20 px.
- Vital numbers now `clamp(2.5rem, 2vw + 1.5rem, 3rem)` in
  monospace tabular-nums (was 28 px proportional).
- Sparklines 3 px stroke, 64 px chart height (was 2 px / 48 px).
- Crew rail cards: 120 px min-height (was 76), with a new
  `desktop-crew-sparkline` child holding a 40 px sparkline at the
  bottom of each card.
- Bottom panel: 32 px margin-top, 48 px tabs, 250 px min content
  area.
- New `components/ui/BarChart.tsx` — smooth inline-SVG line chart
  for the sleep tile. Old `components/SleepDebtBar.tsx` deleted.
- `lib/aiScoreColor.ts` (new) — display-only color thresholds for
  the AI risk number. Distinct from `band()` in `lib/aiScore.ts`
  which the LLM sees.

The layout verifier (`scripts/check_desktop_layout.py`) gained 6
spec-driven assertions enforced at viewports ≥ 800 px tall:

- Each crew card has a sparkline ≥ 36 px tall.
- Vitals panel padding ≥ 20 px.
- Bottom panel `margin-top` ≥ 28 px.
- Tab content area ≥ 240 px.
- AI score number ≥ 40 px tall.
- Radiation bar ≥ 14 px tall.

The existing trust model is unchanged. The AI score is still
advisory only. The cascade is still free-only by default.

### Audit answers (unchanged from the original)

- No new prompt-injection surface introduced.
- No new client-controlled path to the LLM.
- No new server-side state. `useReducer` shape is unchanged.
- No new env vars are *required* to keep the existing behavior;
  the new env vars default to the prior behavior.

## What `ab82111` changed

The substantive LLM engineering change. This is the one to read
carefully.

### Root cause

OpenRouter's free-tier catalog now has effectively one chat model
(`apodex/apodex-1.1-mini:free`). When that one model is unavailable,
flaky, or rate-limited, the cascade fell through to a generic
`Error("all cascade models failed")` which surfaced in the UI as
"The brief could not be generated" — no signal about why.

### What landed

**`lib/openrouter.ts`** — typed `CascadeError` with a `kind`
discriminator:

```ts
export type CascadeErrorKind =
  | "missing_api_key"      // OPENROUTER_API_KEY is unset
  | "auth"                 // OpenRouter returned 401/403
  | "no_models"            // catalog had 0 allowed models
  | "catalog_unavailable"  // /models endpoint failed
  | "all_failed";          // every model tried failed
```

`callCascade` and `streamCascade` now throw `CascadeError` instead
of generic `Error`. The 401/403 path also no longer falls through;
a bad key is a terminal error because retrying with the same key
won't help.

**New env vars** (both optional, default = prior behavior):

- `OPENROUTER_MAX_PRICE_PER_1K` (default `0`) — when `0`, only
  models with prompt = 0 AND completion = 0 qualify. When
  positive, models with prompt ≤ cap AND completion ≤ cap qualify.
  `0.0001` ≈ "up to 10¢ per 1M tokens". Unparseable prices are
  always rejected.
- `OPENROUTER_MODEL` — when set, pins a single model id and
  skips the catalog entirely. Useful when the free catalog is
  empty.

**`/api/brief` and `/api/chat` route handlers** — map each
`CascadeError.kind` to a specific `{code, error}` response. Auth →
502 (don't leak upstream auth details to the browser). Everything
else → 503 with a user-facing message that names the specific
cause.

**`app/page.tsx`** — parses the `code` field from the response and
shows a specific user-facing message keyed on the code. The generic
message is the fallback. The chat error path also now uses the
same code-based lookup (the SSE `data: {"error": ..., "code": ...}`
frame is parsed for both fields).

### Why this is the right fix

The previous design conflated four distinct failure modes into one
generic error:

1. Operator forgot to set the API key.
2. The API key is rejected by OpenRouter.
3. OpenRouter's free catalog has no models that meet the price
   filter.
4. The catalog has models but every one of them failed at request
   time.

Each one needs a different operator response. The new `code`
field lets the UI surface that signal without the route handler
leaking the upstream error verbatim. The env-var escape hatches
let the operator widen the cascade without code changes.

### Audit answers

- **No new security surface.** The new code does not change which
  data flows to the LLM. `parseCrewSnapshot` and
  `sanitizeAlertHistory` are unchanged. The `messages.filter(role
  === "user")` defense in `/api/chat/route.ts` is unchanged.
- **No new client-controlled paths.** The new error codes are
  server-determined.
- **No new secrets logged.** The cascade logger continues to log
  only the model id and HTTP status. The route handlers log the
  CascadeError `kind` and the high-level message, not the
  underlying exception object.
- **Backward compatible.** Without setting the new env vars, the
  cascade behavior is identical to before. The only change for
  existing users is that they now see a specific error message
  instead of a generic one.

### Tests added

`tests/simulation.test.cjs` now has 18 tests (was 14). New:

- `OPENROUTER_MAX_PRICE_PER_1K widens the cascade to include near-free models`
- `OPENROUTER_MODEL bypasses the catalog entirely and pins a single model`
- `callCascade raises a typed 'auth' CascadeError on 401/403 instead of falling through`
- `callCascade raises 'missing_api_key' when OPENROUTER_API_KEY is unset`

Existing tests for the cascade (`select multiple zero-cost text
models only`, `fails rather than selecting paid models when no free
text models exist`, `surfaces a timeout`, `chat streaming falls
back`, `chat streaming rejects empty stream`) were updated to
assert on `CascadeError.kind` rather than error message regex.

## Operational notes

- **Today's OpenRouter free catalog.** At audit-addendum time,
  the only model with prompt = completion = 0 is
  `apodex/apodex-1.1-mini:free`. When it is down, the cascade
  falls through to `all_failed`. Operators should either:
  1. Set `OPENROUTER_MODEL=<specific model id>` to pin a known-
     working model.
  2. Set `OPENROUTER_MAX_PRICE_PER_1K=0.0001` to allow near-free
     paid models (small cost per call).
  3. Wait for the free model to come back up.
- **The "Which model served me?" log line.** Every successful
  cascade call still logs `[openrouter] served by: <model>` (or
  `[openrouter] stream completed by: <model>`). The model id is
  also surfaced in the UI as `model · <id>` under each brief and
  chat thread.
- **Cold-start latency unchanged.** The cascade cache is still
  10 minutes. The new env vars don't affect cold-start; the
  first call after deploy still fetches the catalog and tries the
  top model.

## Verdict

`ab82111` and `80302ff` are both safe to ship. The original audit
verdict ("Ship it. The code is small, well-tested, and the trust
boundary is defended in depth") is unchanged.

The `AGENTS.md` and `CHANGELOG.md` files are new and supersede
this addendum for future agents — read those first.
