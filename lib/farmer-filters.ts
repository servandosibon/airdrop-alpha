import { AirdropOpportunity } from "./types";

/**
 * Centralized so the same "what capital/effort bucket does this opportunity
 * fall into" logic isn't duplicated between the filter UI
 * (OpportunityExplorer) and anywhere else that wants to describe an
 * opportunity's farming difficulty (e.g. the detail page's OG description).
 */
export type CapitalTier = "low" | "medium" | "high";

export const CAPITAL_OPTIONS: { value: CapitalTier; label: string }[] = [
  { value: "low", label: "Low (<$50)" },
  { value: "medium", label: "Medium ($50-$500)" },
  { value: "high", label: "High ($500+)" },
];

export function capitalBucket(op: AirdropOpportunity): CapitalTier {
  const max = op.estimatedCost.max;
  if (max < 50) return "low";
  if (max <= 500) return "medium";
  return "high";
}

export type TimeCommitmentTier = "quick" | "moderate" | "intensive";

export const TIME_COMMITMENT_OPTIONS: { value: TimeCommitmentTier; label: string }[] = [
  { value: "quick", label: "Quick (<15 min)" },
  { value: "moderate", label: "Moderate" },
  { value: "intensive", label: "Intensive" },
];

export function timeCommitmentBucket(op: AirdropOpportunity): TimeCommitmentTier {
  const m = op.estimatedTimeMinutesPerWeek;
  if (m < 15) return "quick";
  if (m <= 60) return "moderate";
  return "intensive";
}

export function capitalLabel(tier: CapitalTier): string {
  return CAPITAL_OPTIONS.find((o) => o.value === tier)?.label ?? tier;
}

export function timeCommitmentLabel(tier: TimeCommitmentTier): string {
  return TIME_COMMITMENT_OPTIONS.find((o) => o.value === tier)?.label ?? tier;
}
