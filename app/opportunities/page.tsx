import { opportunities, CHAINS, CATEGORIES } from "@/lib/data";
import SummaryMetrics from "@/components/SummaryMetrics";
import OpportunityExplorer from "@/components/OpportunityExplorer";

export const metadata = { title: "Top Airdrop Opportunities — Airdrop Alpha" };

export default function OpportunitiesPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display font-700 text-3xl text-paper-100">Top Airdrop Opportunities</h1>
        <p className="text-paper-500 mt-1">Ranked by expected value, efficiency, risk and token probability.</p>
      </div>

      <div className="mb-8">
        <SummaryMetrics opportunities={opportunities} />
      </div>

      <OpportunityExplorer opportunities={opportunities} chains={CHAINS} categories={CATEGORIES} />
    </div>
  );
}
