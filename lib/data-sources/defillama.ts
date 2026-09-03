// Note: deliberately no `import "server-only"` here — this module is pure
// fetch + normalization logic with no framework dependency, which keeps it
// trivially unit-testable (see tests/defillama.test.ts). The guard lives one
// layer up, on lib/objective-metrics.ts and lib/opportunities-live.ts, which
// are the modules pages actually import.

const DEFILLAMA_BASE_URL = "https://api.llama.fi";
const FETCH_TIMEOUT_MS = 8_000;

/** How long a trimmed result may be served from the in-memory cache before refetching. */
export const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface RawDefiLlamaProtocol {
  tvl?: { date: number; totalLiquidityUSD: number }[];
  currentChainTvls?: Record<string, number>;
}

/** The only fields this product actually uses — everything else in the raw
 * DeFiLlama payload (chain breakdowns, token info, audit links, and above
 * all the full historical TVL time series) is discarded immediately after
 * normalization and never held onto. */
export interface NormalizedDefiLlamaMetrics {
  tvl?: number;
  tvl7dChange?: number; // percent, e.g. 4.2 means +4.2%
  tvl30dChange?: number;
}

export type DefiLlamaFetchResult =
  | { ok: true; data: NormalizedDefiLlamaMetrics; fromCache: boolean }
  | { ok: false; error: string };

interface CacheEntry {
  data: NormalizedDefiLlamaMetrics;
  timestamp: number;
}

/**
 * Module-level in-memory cache, keyed by protocol slug. This exists
 * specifically because Next.js's built-in fetch Data Cache hard-rejects any
 * entry over 2MB ("items over 2MB can not be cached") — and DeFiLlama's raw
 * `/protocol/{slug}` payload (full historical TVL series) regularly exceeds
 * that for large, long-running protocols like LayerZero. Rather than fight
 * that limit, we bypass the Data Cache entirely for this fetch (`cache:
 * "no-store"` below) and cache only the small, already-normalized result
 * ourselves — a {tvl, tvl7dChange, tvl30dChange} object is a few dozen
 * bytes, nowhere near any size limit, and this is exactly the data every
 * caller actually wants.
 *
 * This lives for the lifetime of the server process/instance. On
 * serverless platforms with multiple concurrent instances that means each
 * instance keeps its own cache — acceptable for V1 (worst case is a few
 * redundant DeFiLlama calls across instances, never a correctness issue,
 * since a cache miss just re-fetches).
 */
const memoryCache = new Map<string, CacheEntry>();

function pctChange(from: number, to: number): number | undefined {
  if (!from || from <= 0) return undefined;
  return ((to - from) / from) * 100;
}

/**
 * Normalizes a raw DeFiLlama protocol payload into just the fields this
 * product cares about right now (current TVL, 7d/30d change). Kept as a
 * standalone, pure, exported function — separate from the fetch/cache logic
 * below — so it stays trivially unit-testable with plain fixture objects.
 */
export function normalizeDefiLlamaData(raw: RawDefiLlamaProtocol): NormalizedDefiLlamaMetrics {
  const history = raw.tvl;
  if (!history || history.length === 0) {
    return {};
  }

  const latest = history[history.length - 1];
  const tvl = latest?.totalLiquidityUSD;

  const DAY = 24 * 60 * 60;
  const findClosestBefore = (secondsAgo: number) => {
    const targetDate = latest.date - secondsAgo;
    // history is chronological; walk backwards to find the closest entry at
    // or before the target date.
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].date <= targetDate) return history[i];
    }
    return undefined;
  };

  const sevenDaysAgo = findClosestBefore(7 * DAY);
  const thirtyDaysAgo = findClosestBefore(30 * DAY);

  return {
    tvl,
    tvl7dChange: sevenDaysAgo && tvl !== undefined ? pctChange(sevenDaysAgo.totalLiquidityUSD, tvl) : undefined,
    tvl30dChange: thirtyDaysAgo && tvl !== undefined ? pctChange(thirtyDaysAgo.totalLiquidityUSD, tvl) : undefined,
  };
}

/**
 * Fetches (and normalizes, and caches) https://api.llama.fi/protocol/{slug}
 * — DeFiLlama's free, keyless protocol endpoint. Never throws: network
 * errors, timeouts, 404s and malformed JSON are all captured and returned
 * as `{ ok: false }` so a single bad protocol can never take down a page
 * render — callers (lib/objective-metrics.ts) turn that into a `stale`
 * metrics object, and the analyst dataset in lib/data.ts is always the
 * fallback since it's never overwritten by this layer.
 */
export async function fetchDefiLlamaProtocol(slug: string): Promise<DefiLlamaFetchResult> {
  const cached = memoryCache.get(slug);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { ok: true, data: cached.data, fromCache: true };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${DEFILLAMA_BASE_URL}/protocol/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
      // Deliberately NOT using Next.js's `next: { revalidate }` Data Cache
      // here — see the memoryCache comment above for why. `no-store` tells
      // Next not to attempt to persist this (potentially multi-MB) raw
      // response at all; our own cache below handles reuse instead.
      cache: "no-store",
    });

    if (!res.ok) {
      return { ok: false, error: `DeFiLlama returned HTTP ${res.status} for "${slug}"` };
    }

    const json = (await res.json()) as unknown;
    if (typeof json !== "object" || json === null) {
      return { ok: false, error: `DeFiLlama returned a malformed response for "${slug}"` };
    }

    // Normalize immediately and let the raw payload (which can exceed 2MB
    // for large protocols) fall out of scope here — only the trimmed
    // result below is retained, in the cache or otherwise.
    const data = normalizeDefiLlamaData(json as RawDefiLlamaProtocol);
    memoryCache.set(slug, { data, timestamp: Date.now() });

    return { ok: true, data, fromCache: false };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.name === "AbortError"
          ? `DeFiLlama request for "${slug}" timed out after ${FETCH_TIMEOUT_MS}ms`
          : err.message
        : "Unknown error fetching DeFiLlama";
    // Intentionally console.error (not throw) — a data-source failure should
    // degrade the page, never crash it.
    console.error(`[defillama] ${message}`);
    return { ok: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}
