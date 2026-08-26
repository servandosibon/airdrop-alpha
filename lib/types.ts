export type Level = "low" | "medium" | "high";
export type Status = "active" | "upcoming" | "potential" | "ended";

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

  /** true when reward/funding figures are illustrative estimates rather than
   * a confirmed, sourced figure. Always show the "estimated" disclaimer for these. */
  unverified?: boolean;
}
