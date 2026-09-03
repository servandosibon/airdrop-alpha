import Link from "next/link";
import { AirdropOpportunity } from "@/lib/types";
import ScoreGauge from "./ScoreGauge";
import { LevelBadge, StatusBadge, SourceTypeBadge, VerifiedBadge } from "./Badge";
import WatchButton from "./WatchButton";
import { LiveDataChip } from "./LiveData";

function money(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

function formatTime(minutes: number) {
  if (minutes < 60) return `${minutes} min/wk`;
  const h = Math.round((minutes / 60) * 10) / 10;
  return `${h} hr/wk`;
}

export default function OpportunityCard({ op }: { op: AirdropOpportunity }) {
  return (
    <Link
      href={`/opportunities/${op.slug}`}
      className="group block rounded-lg border border-ink-600 bg-ink-800 hover:border-signal-amber/50 hover:bg-ink-700/60 transition-colors p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-11 h-11 rounded-md bg-ink-700 border border-ink-600 flex items-center justify-center font-display font-700 text-paper-300 flex-shrink-0">
            {op.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-700 text-paper-100 truncate">{op.name}</h3>
              <StatusBadge status={op.status} />
            </div>
            <p className="text-xs text-paper-500 mt-0.5">
              {op.chain} · {op.category}
            </p>
            {op.dataSources?.defillama && (
              <div className="mt-1">
                <LiveDataChip data={op.dataSources.defillama} />
              </div>
            )}
          </div>
        </div>
        <ScoreGauge score={op.alphaScore} size={64} />
      </div>

      <div className="grid grid-cols-3 gap-3 mt-5 text-sm">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-paper-500">Reward (est.)</div>
          <div className="font-mono tabular text-paper-100 mt-0.5">
            {money(op.estimatedReward.min)}–{money(op.estimatedReward.max)}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-paper-500">Cost (est.)</div>
          <div className="font-mono tabular text-paper-100 mt-0.5">
            {money(op.estimatedCost.min)}–{money(op.estimatedCost.max)}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-paper-500">Time</div>
          <div className="font-mono tabular text-paper-100 mt-0.5">{formatTime(op.estimatedTimeMinutesPerWeek)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-ink-600">
        <div className="flex items-center gap-2 flex-wrap">
          <LevelBadge level={op.tokenProbability} />
          <LevelBadge level={op.risk} invert />
          <LevelBadge level={op.competition} invert />
        </div>
        <WatchButton slug={op.slug} compact />
      </div>

      <div className="flex items-center justify-between mt-3 flex-wrap gap-1.5">
        <SourceTypeBadge sourceType={op.sourceType} />
        <VerifiedBadge date={op.lastVerified} />
      </div>
    </Link>
  );
}
