import { ScoreBreakdown as ScoreBreakdownType } from "@/lib/types";
import { SCORE_LABELS, SCORE_WEIGHTS } from "@/lib/scoring";

export default function ScoreBreakdown({ breakdown }: { breakdown: ScoreBreakdownType }) {
  const keys = Object.keys(SCORE_WEIGHTS) as (keyof ScoreBreakdownType)[];
  return (
    <div className="space-y-3">
      {keys.map((key) => {
        const max = SCORE_WEIGHTS[key];
        const value = breakdown[key];
        const pct = (value / max) * 100;
        return (
          <div key={key}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-paper-300">{SCORE_LABELS[key]}</span>
              <span className="font-mono tabular text-paper-100">
                {value}/{max}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-ink-700 overflow-hidden">
              <div className="h-full bg-signal-amber rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
