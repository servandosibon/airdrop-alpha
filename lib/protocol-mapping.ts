/**
 * Explicit mapping from our opportunity id -> DeFiLlama protocol slug.
 *
 * Deliberately NOT automatic/fuzzy. Only add a row here once you've confirmed
 * the slug on https://defillama.com/protocol/<slug> yourself — a wrong match
 * would silently show one project's TVL on another project's page, which is
 * worse than showing nothing.
 *
 * If an opportunity isn't listed here, the ingestion layer leaves its
 * `dataSources.defillama` empty and the UI simply doesn't show a live-data
 * panel for it. That's the correct behavior for opportunities that aren't
 * DeFiLlama-tracked protocols (raw L1/L2 chains, CEXs, wallets, etc.) — most
 * of this dataset falls in that bucket, which is expected and fine.
 */
export const DEFILLAMA_PROTOCOL_MAP: Record<string, string> = {
  "layerzero-zero": "layerzero",
  "polymarket-points": "polymarket",
  "grvt-rewards": "grvt",

  // Not mapped (left for a human to verify before adding):
  // - megaeth, monad: pre-token L1/L2s without a DefiLlama "protocol" TVL entry
  //   as of this writing (chain-level TVL exists but isn't what this MVP tracks yet).
  // - base-network-token: Base is a chain on DefiLlama, not a single "protocol" —
  //   would need the /v2/historicalChainTvl/{chain} endpoint, a different
  //   integration than the one built here. Deliberately deferred.
  // - backpack-exchange: DefiLlama tracks CEXs under a separate CEX-assets
  //   section, not the standard protocol TVL endpoint used here. Deferred.
  // - metamask, fogo, succinct, eclipse, hyperevm-apps, checkpoint, truenorth:
  //   not confidently matched to a specific DefiLlama protocol slug — verify
  //   manually on defillama.com/protocol/<slug> before adding a row.
};

export function getDefiLlamaSlug(opportunityId: string): string | undefined {
  return DEFILLAMA_PROTOCOL_MAP[opportunityId];
}
