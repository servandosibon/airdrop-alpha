import { notFound } from "next/navigation";
import Link from "next/link";
import { getOpportunityBySlug, opportunities } from "@/lib/data";
import ScoreGauge from "@/components/ScoreGauge";
import ScoreBreakdown from "@/components/ScoreBreakdown";
import { LevelBadge, StatusBadge, Chip } from "@/components/Badge";
import WatchButton from "@/components/WatchButton";

export function generateStaticParams() {
  return opportunities.map((o) => ({ slug: o.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const op = getOpportunityBySlug(params.slug);
  return { title: op ? `${op.name} — Airdrop Alpha` : "Not found" };
}

function money(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

function formatTime(minutes: number) {
  if (minutes < 60) return `${minutes} min / week`;
  const h = Math.round((minutes / 60) * 10) / 10;
  return `${h} hr / week`;
}

export default function OpportunityDetailPage({ params }: { params: { slug: string } }) {
  const op = getOpportunityBySlug(params.slug);
  if (!op) notFound();

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link href="/opportunities" className="text-sm text-paper-500 hover:text-paper-100">
        ← Back to opportunities
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-6 mt-4">
        <ScoreGauge score={op.alphaScore} size={100} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display font-700 text-2xl sm:text-3xl text-paper-100">{op.name}</h1>
            <StatusBadge status={op.status} />
          </div>
          <p className="text-paper-500 mt-1">
            {op.chain} · {op.category}
            {op.officialWebsite && (
              <>
                {" · "}
                <a href={op.officialWebsite} target="_blank" rel="noopener noreferrer" className="text-signal-teal hover:underline">
                  Official website ↗
                </a>
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {op.tags.map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
        </div>
        <WatchButton slug={op.slug} />
      </div>

      <p className="text-paper-300 mt-6 leading-relaxed">{op.description}</p>
      {op.unverified && (
        <p className="text-xs text-paper-500 mt-2 italic">
          Reward, cost and token figures below are analytical estimates based on public information — not confirmed
          payouts.
        </p>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
        <Metric label="Estimated reward" value={`${money(op.estimatedReward.min)}–${money(op.estimatedReward.max)}`} />
        <Metric label="Estimated cost" value={`${money(op.estimatedCost.min)}–${money(op.estimatedCost.max)}`} />
        <Metric label="Time required" value={formatTime(op.estimatedTimeMinutesPerWeek)} />
        <MetricBadge label="Token probability" node={<LevelBadge level={op.tokenProbability} />} />
        <MetricBadge label="Competition" node={<LevelBadge level={op.competition} invert />} />
        <MetricBadge label="Risk" node={<LevelBadge level={op.risk} invert />} />
      </div>

      {/* Score breakdown */}
      <section className="mt-10">
        <h2 className="font-display font-700 text-lg text-paper-100 mb-1">Why {op.alphaScore}/100?</h2>
        <p className="text-sm text-paper-500 mb-4">
          Breakdown of the Airdrop Alpha Score.{" "}
          <Link href="/methodology" className="text-signal-teal hover:underline">
            See full methodology →
          </Link>
        </p>
        <div className="rounded-lg border border-ink-600 bg-ink-800 p-5">
          <ScoreBreakdown breakdown={op.scoreBreakdown} />
        </div>
      </section>

      {/* Why we like it / Risks */}
      <div className="grid md:grid-cols-2 gap-6 mt-10">
        <section className="rounded-lg border border-ink-600 bg-ink-800 p-5">
          <h2 className="font-display font-700 text-signal-teal mb-3">Why we like it</h2>
          <ul className="space-y-2 text-sm text-paper-300">
            {op.whyWeLikeIt.map((point, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-signal-teal">+</span> {point}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-lg border border-ink-600 bg-ink-800 p-5">
          <h2 className="font-display font-700 text-signal-rose mb-3">Risks</h2>
          <ul className="space-y-2 text-sm text-paper-300">
            {op.risks.map((point, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-signal-rose">–</span> {point}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* How to farm */}
      <section className="mt-10">
        <h2 className="font-display font-700 text-lg text-paper-100 mb-4">How to farm</h2>
        <ol className="space-y-4">
          {op.farmingSteps.map((step, i) => (
            <li key={i} className="flex gap-4 rounded-lg border border-ink-600 bg-ink-800 p-4">
              <span className="font-mono text-signal-amber text-sm w-6 flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <div className="font-medium text-paper-100">{step.title}</div>
                <p className="text-sm text-paper-500 mt-0.5">{step.description}</p>
                <div className="flex gap-3 mt-1.5 text-xs text-paper-500 font-mono">
                  {step.estimatedCost && <span>cost: {step.estimatedCost}</span>}
                  {step.estimatedTime && <span>time: {step.estimatedTime}</span>}
                  {step.url && (
                    <a href={step.url} target="_blank" rel="noopener noreferrer" className="text-signal-teal hover:underline">
                      link ↗
                    </a>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <p className="text-xs text-paper-500 mt-10 pt-6 border-t border-ink-600 leading-relaxed">
        Last updated {op.lastUpdated}. This page is informational and analytical, not financial or investment advice.
        Independently verify official links before connecting a wallet or sending funds.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-600 bg-ink-800 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-paper-500">{label}</div>
      <div className="font-mono tabular text-lg text-paper-100 mt-1">{value}</div>
    </div>
  );
}

function MetricBadge({ label, node }: { label: string; node: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-ink-600 bg-ink-800 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-paper-500 mb-1.5">{label}</div>
      {node}
    </div>
  );
}
