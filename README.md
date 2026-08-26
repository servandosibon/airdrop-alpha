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

## Suggested next steps

1. `npm install && npm run dev`, click through the 5-minute demo flow from spec §24.
2. Sanity-check the dataset caveat above — swap in real research-desk numbers where it matters most (the 3 opportunities shown on the landing page make the first impression).
3. Tell me if you want the Next.js API layer stubbed in now (item 1 above) so the "static dataset → DB → ingestion" migration path in spec §22 has a seam to grow from.
