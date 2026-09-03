export type Level = "low" | "medium" | "high";
export type Status = "active" | "upcoming" | "potential" | "ended";
export type SourceType = "live_defillama" | "curated_research";

export interface ScoreBreakdown {
  tokenProbability: number; // out of 20
  expectedReward: number; // out of 25
  capitalEfficiency: number; // out of 15
  timeEfficiency: number; // out of 15
  competition: number; // out of 10
  risk: number; // out of 15
}

export interface FarmingStep {
  title: string;
  description: string;
  estimatedCost?: string;
  estimatedTime?: string;
  url?: string;
}

export interface AirdropOpportunity {
  id: string;
  name: string;
  slug: string;
  chain: string;
  category: string;
  status: Status;

  alphaScore: number; // 0-100, derived from scoreBreakdown via lib/scoring.ts
  scoreBreakdown: ScoreBreakdown;

  estimatedReward: { min: number; max: number; currency: "USD" };
  estimatedCost: { min: number; max: number; currency: "USD" };
  estimatedTimeMinutesPerWeek: number;

  tokenProbability: Level;
  competition: Level;
  risk: Level;

  funding?: { amount?: number; currency?: string; investors?: string[] };
  tvl?: number;

  description: string;
  whyWeLikeIt: string[];
  risks: string[];
  farmingSteps: FarmingStep[];

  officialWebsite?: string;
  lastUpdated: string;
  tags: string[];

  /**
   * When an analyst last confirmed this opportunity's analysis fields are
   * still accurate (distinct from `dataSources.defillama.lastFetchedAt`,
   * which tracks the live TVL fetch, not the analysis itself).
   */
  lastVerified?: string;

  /**
   * Baseline claim about whether this opportunity has a live external data
   * integration at all. For opportunities with a DeFiLlama mapping, the
   * live-data layer (lib/opportunities-live.ts) trusts this only as a
   * starting point — it downgrades the effective badge to
   * "curated_research" at request time if the live fetch is stale/failed,
   * so the UI never claims fresher data than it actually has.
   */
  sourceType?: SourceType;

  /** true when reward/funding figures are illustrative estimates rather than
   * a confirmed, sourced figure. Always show the "estimated" disclaimer for these. */
  unverified?: boolean;

  /**
   * Objective, machine-fetched data from external sources. Never written by
   * hand and never overwrites analyst fields above — merged in at request
   * time by lib/objective-metrics.ts. Absent until a fetch has run.
   */
  dataSources?: {
    defillama?: DefiLlamaMetrics;
  };
}

export interface DefiLlamaMetrics {
  protocolSlug: string;
  tvl?: number;
  tvl7dChange?: number; // percent, e.g. 4.2 means +4.2%
  tvl30dChange?: number;
  lastFetchedAt: string; // ISO timestamp
  /** true when the fetch failed and this is stale/last-known data (or entirely absent) */
  stale: boolean;
  error?: string;
}

