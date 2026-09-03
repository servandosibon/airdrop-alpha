import Link from "next/link";
import { getLiveOpportunities } from "@/lib/opportunities-live";
import ScoreGauge from "@/components/ScoreGauge";
import { LevelBadge } from "@/components/Badge";
import { LiveDataChip } from "@/components/LiveData";

export const revalidate = 3600; // 60 min — matches the DeFiLlama ingestion cadence

export default async function LandingPage() {
  const opportunities = await getLiveOpportunities();
  const TOP = [...opportunities].sort((a, b) => b.alphaScore - a.alphaScore).slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink-600 bg-grid-fade">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-signal-amber border border-signal-amberDim rounded-full px-3 py-1 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-amber" /> Airdrop intelligence
            </div>
            <h1 className="font-display font-700 text-4xl sm:text-5xl leading-[1.05] text-paper-100">
              Find the airdrops worth your time.
            </h1>
            <p className="text-paper-300 text-lg mt-5 max-w-xl">
              We analyze crypto airdrop opportunities and rank them by expected value, cost, time, risk and
              probability of reward — so you research five projects, not fifty.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Link
                href="/opportunities"
                className="px-5 py-3 rounded-md bg-signal-amber text-ink-950 font-medium hover:brightness-110 transition"
              >
                Explore Opportunities
              </Link>
              <Link
                href="/methodology"
                className="px-5 py-3 rounded-md border border-ink-600 text-paper-100 hover:border-ink-500 transition"
              >
                How it works
              </Link>
            </div>
            <p className="text-xs text-paper-500 mt-6 max-w-md">
              Estimates only — not financial advice, and never a guarantee of any reward.
            </p>
          </div>

          {/* Signature element: a live-look ranked terminal panel */}
          <div className="rounded-xl border border-ink-600 bg-ink-800/70 backdrop-blur p-4">
            <div className="flex items-center justify-between px-2 pb-3 border-b border-ink-600">
              <span className="text-xs font-mono uppercase tracking-widest text-paper-500">Top ranked · live dataset</span>
              <span className="text-xs font-mono text-signal-teal">● scoring engine</span>
            </div>
            <div className="divide-y divide-ink-600">
              {TOP.map((op, i) => (
                <div key={op.id} className="flex items-center gap-4 py-4 px-2">
                  <span className="font-mono text-paper-500 text-sm w-4">{i + 1}</span>
                  <ScoreGauge score={op.alphaScore} size={52} />
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-700 text-paper-100 truncate">{op.name}</div>
                    <div className="text-xs text-paper-500">
                      {op.chain} · {op.category}
                    </div>
                    {op.dataSources?.defillama && (
                      <div className="mt-0.5">
                        <LiveDataChip data={op.dataSources.defillama} />
                      </div>
                    )}
                  </div>
                  <LevelBadge level={op.tokenProbability} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid sm:grid-cols-3 gap-8">
        {[
          {
            title: "One transparent score",
            body: "Every opportunity gets an Airdrop Alpha Score out of 100, broken down into the six factors that built it — never a black box.",
          },
          {
            title: "Costs and time, upfront",
            body: "Estimated reward, estimated cost and estimated time per week, side by side, so you can compare apples to apples.",
          },
          {
            title: "Risks, not just upside",
            body: "Every entry documents why we like it and what could go wrong — including when a project simply has no confirmed token yet.",
          },
        ].map((f) => (
          <div key={f.title}>
            <h3 className="font-display font-700 text-paper-100">{f.title}</h3>
            <p className="text-sm text-paper-500 mt-2 leading-relaxed">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
