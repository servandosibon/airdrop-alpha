import "server-only";
import { opportunities as staticOpportunities, getOpportunityBySlug as getStaticBySlug } from "./data";
import { getObjectiveMetrics } from "./objective-metrics";
import { AirdropOpportunity } from "./types";
import { getDefiLlamaSlug } from "./protocol-mapping";

/**
 * The one function pages should call. Returns the full opportunity list with
 * `dataSources.defillama` populated wherever a mapping exists — analyst
 * fields (score, reward, risk, farming steps, ...) are always exactly what's
 * in lib/data.ts. Fetches only run for mapped opportunities and run in
 * parallel; unmapped opportunities cost nothing extra.
 */
export async function getLiveOpportunities(): Promise<AirdropOpportunity[]> {
  return Promise.all(staticOpportunities.map(attachLiveData));
}

export async function getLiveOpportunityBySlug(slug: string): Promise<AirdropOpportunity | undefined> {
  const op = getStaticBySlug(slug);
  if (!op) return undefined;
  return attachLiveData(op);
}

async function attachLiveData(op: AirdropOpportunity): Promise<AirdropOpportunity> {
  if (!getDefiLlamaSlug(op.id)) return op; // no mapping — return analyst data untouched

  const defillama = await getObjectiveMetrics(op.id);
  if (!defillama) return op;

  // Never let the UI claim "live" data when the fetch actually failed —
  // downgrade the badge to curated_research rather than showing a stale
  // "live" label next to a "data unavailable" panel.
  const sourceType = defillama.stale ? "curated_research" : "live_defillama";

  return { ...op, sourceType, dataSources: { ...op.dataSources, defillama } };
}
