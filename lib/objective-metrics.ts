import "server-only";
import { getDefiLlamaSlug } from "./protocol-mapping";
import { fetchDefiLlamaProtocol } from "./data-sources/defillama";
import { DefiLlamaMetrics } from "./types";

/**
 * Returns objective (machine-fetched) metrics for one opportunity, or
 * `undefined` if the opportunity has no confirmed DeFiLlama mapping.
 *
 * This function is the single seam between "external data source" and
 * "our data model" — fetchDefiLlamaProtocol() already returns normalized,
 * trimmed data (see lib/data-sources/defillama.ts), so there's nothing left
 * to shape here beyond attaching our own metadata (slug, fetch time,
 * staleness). Analyst fields are never touched here.
 */
export async function getObjectiveMetrics(opportunityId: string): Promise<DefiLlamaMetrics | undefined> {
  const slug = getDefiLlamaSlug(opportunityId);
  if (!slug) return undefined;

  const result = await fetchDefiLlamaProtocol(slug);
  const lastFetchedAt = new Date().toISOString();

  if (!result.ok) {
    return {
      protocolSlug: slug,
      lastFetchedAt,
      stale: true,
      error: result.error,
    };
  }

  return {
    protocolSlug: slug,
    tvl: result.data.tvl,
    tvl7dChange: result.data.tvl7dChange,
    tvl30dChange: result.data.tvl30dChange,
    lastFetchedAt,
    stale: false,
  };
}
