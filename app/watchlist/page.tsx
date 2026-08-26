"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWatchlist, WatchlistEntry } from "@/lib/watchlist";
import { getOpportunityBySlug } from "@/lib/data";
import ScoreGauge from "@/components/ScoreGauge";
import { StatusBadge } from "@/components/Badge";
import WatchButton from "@/components/WatchButton";

export default function WatchlistPage() {
  const [entries, setEntries] = useState<WatchlistEntry[] | null>(null);

  useEffect(() => {
    const load = () => setEntries(getWatchlist());
    load();
    window.addEventListener("airdrop-alpha:watchlist-changed", load);
    return () => window.removeEventListener("airdrop-alpha:watchlist-changed", load);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-display font-700 text-3xl text-paper-100">Watchlist</h1>
      <p className="text-paper-500 mt-1">Opportunities you're tracking. Stored on this device.</p>

      {entries === null ? null : entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-600 py-16 text-center text-paper-500 mt-8">
          <p className="font-display text-paper-100 mb-1">Your watchlist is empty.</p>
          <p className="text-sm">Add opportunities from the dashboard to track them here.</p>
          <Link href="/opportunities" className="inline-block mt-4 text-sm text-signal-amber hover:underline">
            Explore opportunities →
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {entries.map((entry) => {
            const op = getOpportunityBySlug(entry.slug);
            if (!op) return null;
            return (
              <div key={entry.slug} className="flex items-center gap-4 rounded-lg border border-ink-600 bg-ink-800 p-4">
                <ScoreGauge score={op.alphaScore} size={56} />
                <Link href={`/opportunities/${op.slug}`} className="flex-1 min-w-0 group">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-700 text-paper-100 group-hover:text-signal-amber transition-colors">
                      {op.name}
                    </span>
                    <StatusBadge status={op.status} />
                  </div>
                  <p className="text-xs text-paper-500 mt-0.5">
                    {op.chain} · {op.category} · saved {new Date(entry.savedAt).toLocaleDateString()}
                  </p>
                </Link>
                <WatchButton slug={op.slug} compact />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
