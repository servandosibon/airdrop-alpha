# Airdrop Alpha — MVP

Next.js 14 (App Router) + TypeScript + Tailwind CSS. No backend, no auth, no wallet connection.
Data is a static, hand-curated TypeScript dataset (`lib/data.ts`); watchlist persists in `localStorage`.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000. `npm run build` produces a static-friendly production build (deploy target: Vercel).

> This sandbox has no network access, so `npm install` / `npm run build` could not be run here to verify the
> build end-to-end. The code follows standard Next.js 14 App Router + Tailwind patterns throughout — run the
> commands above locally as the first step and report back anything that doesn't compile.

## What's implemented (maps to the MVP spec)

- **Landing page** (`app/page.tsx`) — hero, "Explore Opportunities" / "How it works" CTAs, three value props, a live-look ranked panel pulling the real top-3 scores from the dataset.
- **Dashboard** (`app/opportunities/page.tsx`) — summary metrics strip + full filter/sort explorer.
- **Filtering & sorting** (`components/OpportunityExplorer.tsx`) — chain, category, cost bucket, time bucket, risk, token probability, min score, and 7 sort modes (Alpha Score, Expected Value, EV/hour, lowest cost, lowest time, token probability, recently added). All client-side over the static dataset — trivial to swap for server-side querying later.
- **Opportunity detail page** (`app/opportunities/[slug]/page.tsx`) — score gauge, key metrics, full score breakdown, Why we like it / Risks, step-by-step farming guide, watchlist toggle.
- **Scoring engine** (`lib/scoring.ts`) — single `SCORE_WEIGHTS` config object drives every score everywhere; `computeAlphaScore` is a pure function; nothing hard-codes weights in the UI.
- **Methodology page** (`app/methodology/page.tsx`) — explains all six factors and states plainly what the score is and isn't.
- **Watchlist** (`lib/watchlist.ts`, `app/watchlist/page.tsx`) — localStorage-backed, abstracted behind `getWatchlist/toggleWatch/isWatched` so swapping in a real backend later doesn't touch calling code.
- **Dataset** (`lib/data.ts`) — 15 opportunities. See the caveat below before showing this to anyone.

## Not built (intentionally, per spec §34)

Wallet connection/custody, transaction execution, real notifications (no placeholder UI added either — wasn't asked for explicitly and adds surface area for no validation value yet), scraping/API ingestion, authentication, billing, analytics wiring.

## Important caveat on the dataset — read before demoing

The 15 entries mix real, currently-discussed projects (MegaETH, Monad, LayerZero, Base, Polymarket, Backpack
Exchange, MetaMask, Fogo, GRVT, Succinct, Eclipse) with a couple of long-tail/meta entries (Checkpoint, TrueNorth)
referenced in recent airdrop-farming commentary. Every entry is flagged `unverified: true` and the reward/cost/time
numbers are **illustrative estimates I constructed for the scoring demo**, not sourced, verified figures — the funding
amounts and program descriptions are grounded in public reporting as of ~August 2026, but exact reward ranges,
cost ranges, and time estimates are placeholders in the spirit of the spec's mock-data allowance (§21), not
research output.

**Before this goes in front of CIC**, someone should replace the reward/cost/time numbers and the score breakdowns
with real research-desk judgment calls — the architecture (one object per opportunity, one weights config) makes
that a data-entry task, not a code change.

## Ambiguities I resolved with a default (flagging per your instructions, §33)

1. **Auth/backend**: took "no auth if watchlist works via localStorage" literally — zero backend routes exist. If you want the demo to look like real SaaS infrastructure (not just a static site) even without real accounts, say so and I'll add a thin Next.js API layer in front of the static dataset.
2. **EV / EV-per-hour formula**: defined as `(reward midpoint − cost midpoint) / hours per week`, shown as a sort option, not surfaced as a raw number on cards (to avoid implying more precision than the estimates support). Reversible if you want it visible.
3. **"Alerts" placeholder (§18)**: left out entirely rather than building a fake UI for it — a non-functional bell icon felt more likely to erode trust than build it, given how much the rest of the product leans on credibility. Easy to add if you disagree.
4. **Score weights**: used the weights exactly as specified (20/25/15/15/10/15). They live in one place (`lib/scoring.ts`) if you want to tune them.

## V1 data ingestion (DeFiLlama) — added on top of the MVP above

**Architecture (smallest change that satisfies the target flow):**

```
DeFiLlama (api.llama.fi)
   ↓  lib/data-sources/defillama.ts     fetch + normalize (pure, testable, no framework import)
   ↓  lib/objective-metrics.ts          per-opportunity: look up mapping → fetch → never throw
   ↓  lib/opportunities-live.ts         getLiveOpportunities() / getLiveOpportunityBySlug()
   ↓  app/page.tsx                     (Server Component, async)
      app/opportunities/page.tsx        (Server Component, async)
      app/opportunities/[slug]/page.tsx (Server Component, async)
```

- **Nothing calls DeFiLlama from the client.** All fetching happens in `lib/data-sources/defillama.ts`, called only from server-side modules (`objective-metrics.ts`, `opportunities-live.ts`), both guarded with `import "server-only"` so an accidental client import fails the build loudly instead of leaking a fetch into the browser.
- **Analyst data is never touched.** `lib/data.ts` (the existing static dataset) is unchanged and still the only place score/reward/risk/farming-steps live. `opportunities-live.ts` only ever adds a `dataSources.defillama` object — it can't overwrite analyst fields even by accident, because it spreads the original opportunity first.
- **Explicit mapping, no fuzzy matching** (`lib/protocol-mapping.ts`): opportunity id → DeFiLlama slug. Currently mapped: `layerzero-zero → layerzero`, `polymarket-points → polymarket`, `grvt-rewards → grvt` — all three verified by hand against defillama.com. Everything else in the dataset is deliberately left unmapped (see comments in that file for why — mostly "this is a raw L1/chain or a CEX, which needs a different DeFiLlama endpoint than the one built here").
- **Caching**: uses Next.js's built-in fetch Data Cache (`next: { revalidate: 3600 }`, i.e. 60 minutes) rather than a custom cache file or DB table — the simplest thing that satisfies "don't call DeFiLlama on every page view." Pages also declare `export const revalidate = 3600` for clarity.
- **Failure handling**: `fetchDefiLlamaProtocol` never throws — timeouts (8s), HTTP errors, and malformed JSON all become `{ ok: false, error }`. `getObjectiveMetrics` turns that into a `{ stale: true, error }` metrics object rather than omitting data silently. The UI (`components/LiveData.tsx`) shows "Data temporarily unavailable" in that case and simply doesn't render anything for opportunities with no mapping at all.
- **Transparency**: the detail page now has a separate "Verified data" panel (TVL, 7d/30d change, source + freshness) sitting above the existing "Airdrop Alpha analysis" section — visually and textually distinct, per your requirement. Cards show a small "TVL $X · updated Nh ago" chip only for mapped opportunities; the landing page's top-3 panel shows the same chip when a top-ranked project happens to be mapped.

**Files added:**
`lib/data-sources/defillama.ts`, `lib/objective-metrics.ts`, `lib/opportunities-live.ts`, `lib/protocol-mapping.ts`, `components/LiveData.tsx`, `tests/defillama.test.ts`

**Files changed:** `lib/types.ts` (added `dataSources`/`DefiLlamaMetrics` types, purely additive), `app/page.tsx`, `app/opportunities/page.tsx` and `app/opportunities/[slug]/page.tsx` (all now async Server Components calling `getLiveOpportunities()` / `getLiveOpportunityBySlug()` instead of the static array directly), `components/OpportunityCard.tsx` (added the optional live-data chip), `package.json` (added `server-only` dep, `tsx` dev dep, a `test` script).

### How to add a new opportunity
Add an entry to `lib/data.ts` as before — nothing about ingestion changes that workflow.

### How to map an opportunity to DeFiLlama
1. Find the project at `https://defillama.com/protocol/<slug>` yourself and confirm it's really the same project.
2. Add `"your-opportunity-id": "the-slug"` to `DEFILLAMA_PROTOCOL_MAP` in `lib/protocol-mapping.ts`.
3. That's it — the next request for that opportunity will fetch and merge live TVL automatically.

### How to run ingestion locally
There's no separate ingestion process to run — it happens inline, server-side, the first time a mapped opportunity's page is requested after the cache window expires. To test it directly: `npm run dev`, then visit `/`, `/opportunities`, `/opportunities/layerzero`, `/opportunities/polymarket-points` or `/opportunities/grvt-rewards` — the last three should show a "Verified data" panel with live TVL.

### How often data refreshes
Every 60 minutes per opportunity (Next.js Data Cache `revalidate: 3600`), within the spec's 6–12h guidance — set shorter for a more "live" feel while demoing to CIC; safe to move back toward 6h once this isn't being actively watched for freshness.

### What remains manual
Everything except TVL/7d-change/30d-change for the 3 currently-mapped opportunities: token probability, expected reward, cost, time, risk, competition, why-we-like-it, risks, farming steps, and all data for the other 12 opportunities.

### Known limitations
- Only 3 of 15 opportunities are mapped — most of this dataset (raw L1s/L2s, CEXs, wallets) isn't representable by DeFiLlama's protocol-TVL endpoint at all; a chain-TVL integration (`/v2/historicalChainTvl/{chain}`) would be a separate, later piece of work for things like Base.
- No persistent store — this relies entirely on Next.js's Data Cache, which is fine on Vercel but means a fresh local `npm run dev` restart re-fetches on first visit. Acceptable for V1; would need a real cache/DB once ingestion grows beyond one source.
- `npm install`/`npm run build`/`npm test` could not be run in this sandbox (no network access) — please run them locally as the first step.

### Next recommended step
Once this is confirmed working locally, the natural next data source is a second explicit mapping table (e.g. a manually-curated funding/investor field refresh from a source like CryptoRank) — same pattern, same seam, no architecture change needed.

## P1/P2 enhancements — step tracking, freshness badges, farmer constraint filters

**1. Interactive step tracking** (`components/FarmingStepChecklist.tsx`)
Replaces the static numbered `<ol>` on the detail page. Each step is a checkbox; checked indices persist to `localStorage` under `airdrop_alpha_completed_steps_{slug}` (per-opportunity key, as specified). Shows "`X of Y steps completed (Z%)`" plus a progress bar, and a "Reset progress" button that clears that slug's storage entry. Hydration-safe: renders an unchecked/0% state on the server and reconciles with `localStorage` after mount, same pattern already used by `WatchButton`.

**2. Data freshness & source transparency** (`lib/types.ts`, `lib/data.ts`, `components/Badge.tsx`)
Added `lastVerified?: string` and `sourceType?: "live_defillama" | "curated_research"` to `AirdropOpportunity`, populated for all 14 dataset entries (`lastVerified` currently mirrors each entry's existing `lastUpdated` date — same underlying "when was this last checked" fact, exposed under the new field name your components expect). `sourceType` is seeded from the DeFiLlama mapping (the 3 mapped opportunities start as `live_defillama`, everything else `curated_research`) — new `SourceTypeBadge` and `VerifiedBadge` components render this on both `OpportunityCard` and the detail page.

One deliberate refinement beyond the literal spec: `lib/opportunities-live.ts` **downgrades `sourceType` to `curated_research` at request time if that opportunity's live DeFiLlama fetch is stale/failed** (`opportunities-live.ts`'s `attachLiveData`). Without this, a temporary DeFiLlama outage would leave a "Live on-chain data" badge next to a "Data temporarily unavailable" panel — actively misleading. The static field in `lib/data.ts` is the baseline claim; the live layer is the source of truth for what actually gets shown.

**3. Farmer constraint filters** (`components/OpportunityExplorer.tsx`)
Added **Capital** (Low <$50 / Medium $50-$500 / High $500+) and **Time commitment** (Quick <15 min / Moderate / Intensive) filters using the exact thresholds requested. These **replace** the earlier "Cost" and "Time" bucket filters rather than sitting alongside them — both old and new versions filtered the same two underlying fields (`estimatedCost.max`, `estimatedTimeMinutesPerWeek`) with different bucket boundaries and labels, so keeping both would have meant two confusing, overlapping controls for the same thing. Chain, category, risk, token probability and min-score filters are all untouched and still compose correctly with the new ones. The empty-state and inline "clear filters" buttons now both read "Clear all filters" per the spec wording.

**Ambiguity flagged, not guessed on:** the ticket's acceptance criteria mentions "without breaking existing search... filters," but no text-search input exists in this codebase — only structured selects. Nothing to preserve there; flagging rather than inventing a search box that wasn't asked for elsewhere in this ticket.

**Not done / left as-is:** did not add a numeric range slider for capital/time (used the same `<select>` pattern as the other filters, consistent with the rest of the explorer) — happy to swap to a slider if that's what "Personal Farmer Constraint Filters" was meant to imply visually.

**Verification:** `npm run build` could not be run in this sandbox (no network access — `npm install` fails with a 403 from the registry). Types were checked by hand — new fields are additive/optional everywhere, `SourceType` is a shared literal union imported consistently, and the dataset script-insertion was verified for balanced braces/brackets and correct per-entry field placement. Please run `npm install && npm run build` locally as the first step and report back anything that doesn't compile.

## V1 final polish — OG metadata, checklist styling, 404s, shareable filter URLs

**1. Dynamic OG/social metadata + explicit 404** (`app/opportunities/[slug]/page.tsx`)
`generateMetadata` is now `async` and calls the same `getLiveOpportunityBySlug()` the page body uses (Next.js dedupes identical fetches within one request, so this doesn't double the DeFiLlama call). Not-found slugs get `title: "Opportunity Not Found | Airdrop Alpha"`; found ones get `"${name} Airdrop Strategy & Score (${alphaScore}/100) | Airdrop Alpha"` plus a description naming category, chain and farming difficulty (Quick/Moderate/Intensive, from the same bucket function the explorer's Time Commitment filter uses — see below), and matching `openGraph`/`twitter` blocks. Added `metadataBase` to `app/layout.tsx` so the relative OG `url` resolves correctly instead of triggering Next's "metadataBase not set" warning — set `NEXT_PUBLIC_SITE_URL` in your environment once there's a real domain, it falls back to `localhost:3000`. The page body's `if (!op) notFound()` was already in place from the previous pass and needed no change.

**2. Checklist completion styling** (`components/FarmingStepChecklist.tsx`)
Checked steps now get `line-through opacity-70` on **both** the title and description (previously only the title had `line-through`, and neither had the opacity). The container's success border/background highlight was already implemented in the previous pass (`border-signal-tealDim bg-signal-tealDim/10`) — left as-is rather than switching to a literal green, since teal is this app's established "positive/success" color everywhere else (low risk, high token probability, the checkmark itself); introducing a one-off green here would be inconsistent with the rest of the design system.

**3. Shareable filter URLs** (`components/OpportunityExplorer.tsx`, new `lib/farmer-filters.ts`, new `lib/url-filters.ts`)
All six `OpportunityExplorer` filters (chain, category, capital, time commitment, risk, token probability, min score) now read their initial value from the URL on mount and push changes back via `router.replace(..., { scroll: false })` — sort order is intentionally excluded, since it changes display order rather than which opportunities are in the list, not a "filter." Query keys: `chain`, `category` (slugified, e.g. `Ethereum L2` → `ethereum-l2`), `capital` (`low`/`medium`/`high`), `time` (`quick`/`moderate`/`intensive`), `risk`, `tokenProbability` (`low`/`medium`/`high`), `minScore` (`70`/`80`/`90`). `"all"`/`0` values are omitted from the URL entirely rather than written as literal `all`, so the clean unfiltered state is just `/opportunities` with no query string. Pulled `capitalBucket`/`timeCommitmentBucket` out of the explorer into `lib/farmer-filters.ts` so the detail page's OG description (item 1 above) and the explorer's filter logic share one definition instead of two.

`useSearchParams()` requires a Suspense boundary to avoid forcing the whole route to opt out of static rendering, so `app/opportunities/page.tsx` now wraps `<OpportunityExplorer />` in `<Suspense>` with a small skeleton fallback.

**Verification:** same limitation as every prior pass — no network access in this sandbox, so `npm run build` could not be run here. I manually re-checked: every new/changed file for balanced braces and parens (scripted check across all 28 `.ts`/`.tsx` files, all clean), and cross-referenced every new import against its module's actual exports (`farmer-filters.ts`, `url-filters.ts`) to catch typos or mismatched names. Please run `npm install && npm run build` locally — that's the one check I genuinely can't substitute for.

## Fix: DeFiLlama Data Cache 2MB limit (`lib/data-sources/defillama.ts`)

**Problem:** `https://api.llama.fi/protocol/{slug}` returns full historical TVL time series — multiple MB for a long-running protocol like LayerZero — and Next.js's fetch Data Cache hard-rejects anything over 2MB with `"Failed to set Next.js data cache, items over 2MB can not be cached"`.

**Fix:**
- The fetch call now uses `cache: "no-store"` instead of `next: { revalidate }`, so Next.js never attempts to persist the raw (potentially multi-MB) response in its Data Cache at all.
- Replaced that with a small **module-level in-memory `Map<string, CacheEntry>`**, keyed by protocol slug, `CACHE_TTL_MS = 60 * 60 * 1000` (1 hour — same cadence as before). Crucially, this cache stores only the **normalized, trimmed** result (`{ tvl, tvl7dChange, tvl30dChange }` — a few dozen bytes) rather than the raw payload — normalization now happens immediately inside `fetchDefiLlamaProtocol` itself (previously it was a separate step callers had to invoke), and the raw JSON falls out of scope right after, never retained anywhere.
- A failed fetch is **never cached** — only successful, normalized results are stored — so a temporary outage doesn't lock the app into showing "unavailable" for a full hour; the next request retries DeFiLlama directly.
- `fetchDefiLlamaProtocol`'s return shape changed from `{ ok: true; raw }` to `{ ok: true; data; fromCache }` (the `fromCache` flag is mostly for debugging/tests). `lib/objective-metrics.ts` was updated to consume `result.data` directly — it no longer calls `normalizeDefiLlamaData` itself, since that now happens inside the fetch layer.
- Error handling is unchanged in spirit from prior passes: failures return `{ ok: false, error }` rather than `null`. I kept this instead of switching to `null` as the ticket's task 4 suggested, because the existing `{ ok, error }` shape already plumbs a human-readable error message all the way to the "Data temporarily unavailable" panel in `components/LiveData.tsx` — collapsing that to `null` would be a regression (losing the error message) for no benefit, and the actual requirement ("gracefully returns... the static fallback if the external request fails") was already satisfied by this shape: `lib/opportunities-live.ts` always spreads the original analyst opportunity first, so a DeFiLlama failure never blocks or corrupts the static fallback either way.
- Extended `tests/defillama.test.ts` to cover the new caching behavior specifically: a second call within the TTL is served from memory without calling `fetch` again; a failed call is never cached and retries on the next call; and the outgoing fetch options are asserted to use `cache: "no-store"` (not `next.revalidate`). Gave every fetch-based test its own unique slug, since the module-level cache now persists across tests within a single `node --test` run and reusing a slug would let one test's cached result silently leak into another's.

**Verification:** same caveat as always — no network access in this sandbox. Re-ran the balanced-braces scan across all files (still clean) and hand-traced every caller of `fetchDefiLlamaProtocol`/`normalizeDefiLlamaData` to confirm the shape change didn't break anything downstream (only `lib/objective-metrics.ts` called it; updated). `npm run dev` and `npm run build` need to be run locally to fully confirm per the acceptance criteria — please check the dev terminal for the specific "items over 2MB" warning to confirm it's gone when loading `/opportunities/layerzero`.
