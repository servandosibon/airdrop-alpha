import "server-only";
import { getDefiLlamaSlug } from "./protocol-mapping";
import { fetchDefiLlamaProtocol, normalizeDefiLlamaData } from "./data-sources/defillama";
import { DefiLlamaMetrics } from "./types";

/**
 * Returns objective (machine-fetched) metrics for one opportunity, or
 * `undefined` if the opportunity has no confirmed DeFiLlama mapping.
 *
 * This function is the single seam between "external data source" and
 * "our data model" — normalizeDefiLlamaData() never leaks its raw shape
 * past this point, and analyst fields are never touched here.
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

  const normalized = normalizeDefiLlamaData(result.raw);
  return {
    protocolSlug: slug,
    tvl: normalized.tvl,
    tvl7dChange: normalized.tvl7dChange,
    tvl30dChange: normalized.tvl30dChange,
    lastFetchedAt,
    stale: false,
  };
}
