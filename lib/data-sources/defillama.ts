// Note: deliberately no `import "server-only"` here — this module is pure
// fetch + normalization logic with no framework dependency, which keeps it
// trivially unit-testable (see tests/defillama.test.ts). The guard lives one
// layer up, on lib/objective-metrics.ts and lib/opportunities-live.ts, which
// are the modules pages actually import.

const DEFILLAMA_BASE_URL = "https://api.llama.fi";
const FETCH_TIMEOUT_MS = 8_000;
/** How long Next.js's Data Cache may serve a cached response before refetching. */
export const DEFILLAMA_REVALIDATE_SECONDS = 60 * 60; // 60 minutes

interface RawDefiLlamaProtocol {
  tvl?: { date: number; totalLiquidityUSD: number }[];
  currentChainTvls?: Record<string, number>;
}

export type DefiLlamaFetchResult =
  | { ok: true; raw: RawDefiLlamaProtocol }
  | { ok: false; error: string };

/**
 * Fetches https://api.llama.fi/protocol/{slug} — DeFiLlama's free, keyless
 * protocol endpoint. Never throws: network errors, timeouts, 404s and
 * malformed JSON are all captured and returned as `{ ok: false }` so a
 * single bad protocol can never take down a page render.
 */
export async function fetchDefiLlamaProtocol(slug: string): Promise<DefiLlamaFetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${DEFILLAMA_BASE_URL}/protocol/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
      // Next.js Data Cache: served from cache for up to 60 minutes, then
      // revalidated in the background. This is what keeps us from calling
      // DeFiLlama on every page render.
      next: { revalidate: DEFILLAMA_REVALIDATE_SECONDS, tags: [`defillama:${slug}`] },
    });

    if (!res.ok) {
      return { ok: false, error: `DeFiLlama returned HTTP ${res.status} for "${slug}"` };
    }

    const json = (await res.json()) as unknown;
    if (typeof json !== "object" || json === null) {
      return { ok: false, error: `DeFiLlama returned a malformed response for "${slug}"` };
    }

    return { ok: true, raw: json as RawDefiLlamaProtocol };
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

function pctChange(from: number, to: number): number | undefined {
  if (!from || from <= 0) return undefined;
  return ((to - from) / from) * 100;
}

/**
 * Normalizes a raw DeFiLlama protocol payload into just the fields this
 * product cares about right now (current TVL, 7d/30d change). Everything
 * else in the payload (chain breakdowns, token info, audit links, etc.) is
 * ignored on purpose — pull in more fields here as the product needs them,
 * rather than storing the whole blob.
 */
export function normalizeDefiLlamaData(raw: RawDefiLlamaProtocol): {
  tvl?: number;
  tvl7dChange?: number;
  tvl30dChange?: number;
} {
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
