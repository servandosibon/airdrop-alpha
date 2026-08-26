import { AirdropOpportunity, ScoreBreakdown } from "./types";

/**
 * Single source of truth for the Airdrop Alpha Score weights.
 * Changing a weight here updates the score everywhere in the app —
 * no UI component hard-codes these numbers.
 */
export const SCORE_WEIGHTS = {
  tokenProbability: 20,
  expectedReward: 25,
  capitalEfficiency: 15,
  timeEfficiency: 15,
  competition: 10,
  risk: 15,
} as const;

export const SCORE_MAX = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0); // 100

export function computeAlphaScore(breakdown: ScoreBreakdown): number {
  const total =
    breakdown.tokenProbability +
    breakdown.expectedReward +
    breakdown.capitalEfficiency +
    breakdown.timeEfficiency +
    breakdown.competition +
    breakdown.risk;
  return Math.round(total);
}

export const SCORE_LABELS: Record<keyof ScoreBreakdown, string> = {
  tokenProbability: "Token probability",
  expectedReward: "Expected reward",
  capitalEfficiency: "Capital efficiency",
  timeEfficiency: "Time efficiency",
  competition: "Competition",
  risk: "Risk",
};

export function scoreTier(score: number): { label: string; tone: "amber" | "teal" | "rose" } {
  if (score >= 85) return { label: "Top tier", tone: "amber" };
  if (score >= 70) return { label: "Strong", tone: "teal" };
  return { label: "Speculative", tone: "rose" };
}

/** EV/hour: expected value midpoint per hour of weekly effort — used for the "EV/hour" sort. */
export function evPerHour(op: AirdropOpportunity): number {
  const rewardMid = (op.estimatedReward.min + op.estimatedReward.max) / 2;
  const costMid = (op.estimatedCost.min + op.estimatedCost.max) / 2;
  const hours = Math.max(op.estimatedTimeMinutesPerWeek / 60, 0.1);
  return (rewardMid - costMid) / hours;
}

export function expectedValue(op: AirdropOpportunity): number {
  const rewardMid = (op.estimatedReward.min + op.estimatedReward.max) / 2;
  const costMid = (op.estimatedCost.min + op.estimatedCost.max) / 2;
  return rewardMid - costMid;
}
