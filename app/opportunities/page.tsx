import { Suspense } from "react";
import { CHAINS, CATEGORIES } from "@/lib/data";
import { getLiveOpportunities } from "@/lib/opportunities-live";
import SummaryMetrics from "@/components/SummaryMetrics";
import OpportunityExplorer from "@/components/OpportunityExplorer";

export const metadata = { title: "Top Airdrop Opportunities — Airdrop Alpha" };
export const revalidate = 3600; // 60 min — matches the DeFiLlama ingestion cadence

export default async function OpportunitiesPage() {
  const opportunities = await getLiveOpportunities();

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display font-700 text-3xl text-paper-100">Top Airdrop Opportunities</h1>
        <p className="text-paper-500 mt-1">Ranked by expected value, efficiency, risk and token probability.</p>
      </div>

      <div className="mb-8">
        <SummaryMetrics opportunities={opportunities} />
      </div>

      {/* OpportunityExplorer reads/writes the URL via useSearchParams, which
          requires a Suspense boundary so the route can still be prerendered
          rather than forcing the whole page to opt out of static rendering. */}
      <Suspense fallback={<ExplorerFallback />}>
        <OpportunityExplorer opportunities={opportunities} chains={CHAINS} categories={CATEGORIES} />
      </Suspense>
    </div>
  );
}

function ExplorerFallback() {
  return <div className="h-10 rounded-md bg-ink-800 border border-ink-600 animate-pulse" />;
}
