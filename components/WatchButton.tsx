"use client";

import { useEffect, useState } from "react";
import { isWatched, toggleWatch } from "@/lib/watchlist";

export default function WatchButton({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const [watched, setWatched] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setWatched(isWatched(slug));
  }, [slug]);

  if (!mounted) return <div className={compact ? "w-8 h-8" : "h-9 w-32"} />;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setWatched(toggleWatch(slug));
      }}
      aria-pressed={watched}
      className={
        compact
          ? `flex items-center justify-center w-8 h-8 rounded-md border transition-colors ${
              watched
                ? "border-signal-amber text-signal-amber bg-signal-amberDim/30"
                : "border-ink-600 text-paper-500 hover:text-paper-100 hover:border-ink-500"
            }`
          : `px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
              watched
                ? "border-signal-amber text-signal-amber bg-signal-amberDim/30"
                : "border-ink-600 text-paper-100 hover:border-ink-500"
            }`
      }
    >
      {compact ? (watched ? "★" : "☆") : watched ? "★ On watchlist" : "☆ Add to watchlist"}
    </button>
  );
}
