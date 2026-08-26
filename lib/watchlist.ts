"use client";

const STORAGE_KEY = "airdrop-alpha:watchlist";

export interface WatchlistEntry {
  slug: string;
  savedAt: string; // ISO date
}

/**
 * Thin storage abstraction. Swap the body of these functions for API calls
 * against a real backend later — callers never need to change.
 */
function readAll(): WatchlistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WatchlistEntry[]) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: WatchlistEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event("airdrop-alpha:watchlist-changed"));
}

export function getWatchlist(): WatchlistEntry[] {
  return readAll();
}

export function isWatched(slug: string): boolean {
  return readAll().some((e) => e.slug === slug);
}

export function toggleWatch(slug: string): boolean {
  const entries = readAll();
  const idx = entries.findIndex((e) => e.slug === slug);
  if (idx >= 0) {
    entries.splice(idx, 1);
    writeAll(entries);
    return false;
  }
  entries.push({ slug, savedAt: new Date().toISOString() });
  writeAll(entries);
  return true;
}
