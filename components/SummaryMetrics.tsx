import { AirdropOpportunity } from "@/lib/types";

export default function SummaryMetrics({ opportunities }: { opportunities: AirdropOpportunity[] }) {
  const tracked = opportunities.length;
  const highScore = opportunities.filter((o) => o.alphaScore >= 80).length;
  const avgCost =
    opportunities.reduce((sum, o) => sum + (o.estimatedCost.min + o.estimatedCost.max) / 2, 0) / (tracked || 1);
  const lastUpdated = opportunities.reduce((latest, o) => (o.lastUpdated > latest ? o.lastUpdated : latest), "0000-00-00");

  const items = [
    { label: "Opportunities tracked", value: tracked },
    { label: "High-score (80+)", value: highScore },
    { label: "Avg. estimated cost", value: `$${avgCost.toFixed(0)}` },
    { label: "Last updated", value: lastUpdated },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-ink-600 bg-ink-800 px-4 py-3">
          <div className="text-[11px] uppercase tracking-wide text-paper-500">{item.label}</div>
          <div className="font-mono tabular text-xl text-paper-100 mt-1">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
