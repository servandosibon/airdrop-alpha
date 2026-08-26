import { SCORE_WEIGHTS, SCORE_LABELS } from "@/lib/scoring";

export const metadata = { title: "Methodology — Airdrop Alpha" };

const DESCRIPTIONS: Record<keyof typeof SCORE_WEIGHTS, { blurb: string; signals: string[] }> = {
  tokenProbability: {
    blurb: "How likely a token or reward program actually materializes for this project.",
    signals: ["Funding and investor profile", "Public statements from the team", "Points/rewards programs already live", "Precedent from comparable projects"],
  },
  expectedReward: {
    blurb: "Estimated potential reward relative to the effort and capital a typical farmer would put in.",
    signals: ["Reported or estimated allocation size", "Comparable historical distributions", "Community share of token supply, where published"],
  },
  capitalEfficiency: {
    blurb: "How much capital is required relative to the potential reward.",
    signals: ["Minimum viable capital to participate meaningfully", "Whether capital needs to stay deployed or is one-off"],
  },
  timeEfficiency: {
    blurb: "How much ongoing time is required relative to the opportunity.",
    signals: ["Weekly time commitment", "Whether activity can be automated or batched safely", "One-off vs. recurring requirements"],
  },
  competition: {
    blurb: "How crowded the opportunity already is. Lower competition scores higher.",
    signals: ["General audience awareness", "Volume of farming-community attention", "Whether rewards are likely to be diluted across many wallets"],
  },
  risk: {
    blurb: "Smart contract, capital and uncertainty risk involved in participating.",
    signals: ["Protocol maturity and audit history, where known", "Sybil-filtering exposure", "Uncertainty in reward mechanics"],
  },
};

export default function MethodologyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="font-display font-700 text-3xl text-paper-100">How Airdrop Alpha scores opportunities</h1>
      <p className="text-paper-300 mt-4 leading-relaxed">
        Every opportunity gets an <strong className="text-paper-100">Airdrop Alpha Score</strong> from 0–100, built
        from six weighted factors. The weights below are our current, transparent starting point — they are
        assumptions we expect to refine, not settled truths, and every score you see is broken down into these same
        six numbers so you can see exactly where it came from.
      </p>

      <div className="mt-10 space-y-6">
        {(Object.keys(SCORE_WEIGHTS) as (keyof typeof SCORE_WEIGHTS)[]).map((key, i) => (
          <div key={key} className="rounded-lg border border-ink-600 bg-ink-800 p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display font-700 text-paper-100">
                <span className="text-paper-500 font-mono text-sm mr-2">{String(i + 1).padStart(2, "0")}</span>
                {SCORE_LABELS[key]}
              </h2>
              <span className="font-mono tabular text-signal-amber">{SCORE_WEIGHTS[key]}%</span>
            </div>
            <p className="text-sm text-paper-300 mt-2">{DESCRIPTIONS[key].blurb}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {DESCRIPTIONS[key].signals.map((s) => (
                <li key={s} className="text-xs text-paper-500 bg-ink-700 border border-ink-600 rounded px-2 py-1">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-signal-amberDim bg-signal-amberDim/10 p-5">
        <h2 className="font-display font-700 text-paper-100 mb-2">What the score is not</h2>
        <p className="text-sm text-paper-300 leading-relaxed">
          Expected Value is an analytical estimate based on available public signals. It is not a guaranteed reward.
          The Airdrop Alpha Score is designed to help you prioritize research and effort — not to predict a
          guaranteed return, confirm a token launch, or replace your own due diligence before connecting a wallet or
          deploying capital.
        </p>
      </div>
    </div>
  );
}
