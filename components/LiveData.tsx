import { DefiLlamaMetrics } from "@/lib/types";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function formatUsd(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function ChangeTag({ pct }: { pct?: number }) {
  if (pct === undefined || Number.isNaN(pct)) return null;
  const positive = pct >= 0;
  return (
    <span className={`font-mono text-xs ${positive ? "text-signal-teal" : "text-signal-rose"}`}>
      {positive ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

/** Full panel for the opportunity detail page. */
export function LiveDataPanel({ data }: { data: DefiLlamaMetrics }) {
  if (data.stale || data.tvl === undefined) {
    return (
      <section className="rounded-lg border border-ink-600 bg-ink-800 p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-bold text-paper-100">Verified data</h2>
          <span className="text-xs text-paper-500">DeFiLlama</span>
        </div>
        <p className="text-sm text-paper-500 mt-2">
          Data temporarily unavailable{data.error ? ` (${data.error})` : ""}. Showing analyst estimates only below.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-ink-600 bg-ink-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-paper-100">Verified data</h2>
        <span className="text-xs text-paper-500">Source: DeFiLlama · updated {timeAgo(data.lastFetchedAt)}</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-paper-500">TVL</div>
          <div className="font-mono tabular text-lg text-paper-100 mt-1">{formatUsd(data.tvl)}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-paper-500">7d change</div>
          <div className="mt-1">
            <ChangeTag pct={data.tvl7dChange} />
            {data.tvl7dChange === undefined && <span className="text-paper-500 text-xs">—</span>}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-paper-500">30d change</div>
          <div className="mt-1">
            <ChangeTag pct={data.tvl30dChange} />
            {data.tvl30dChange === undefined && <span className="text-paper-500 text-xs">—</span>}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Compact inline badge for cards/lists. Renders nothing if there's nothing worth showing. */
export function LiveDataChip({ data }: { data?: DefiLlamaMetrics }) {
  if (!data) return null;
  if (data.stale || data.tvl === undefined) {
    return <span className="text-[11px] text-paper-500 italic">data unavailable</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-paper-500">
      <span className="w-1.5 h-1.5 rounded-full bg-signal-teal" />
      TVL {formatUsd(data.tvl)} · {timeAgo(data.lastFetchedAt)}
    </span>
  );
}
