"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AirdropOpportunity, Level } from "@/lib/types";
import { evPerHour, expectedValue } from "@/lib/scoring";
import {
  CAPITAL_OPTIONS,
  TIME_COMMITMENT_OPTIONS,
  capitalBucket,
  timeCommitmentBucket,
  CapitalTier,
  TimeCommitmentTier,
} from "@/lib/farmer-filters";
import { slugify, matchSlug } from "@/lib/url-filters";
import OpportunityCard from "./OpportunityCard";

type SortKey = "score" | "ev" | "evPerHour" | "cost" | "time" | "tokenProbability" | "recent";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "score", label: "Alpha Score" },
  { key: "ev", label: "Expected value" },
  { key: "evPerHour", label: "EV / hour" },
  { key: "cost", label: "Lowest cost" },
  { key: "time", label: "Lowest time" },
  { key: "tokenProbability", label: "Token probability" },
  { key: "recent", label: "Recently added" },
];

const LEVELS: Level[] = ["low", "medium", "high"];
const SCORE_FLOORS = [0, 70, 80, 90];

function isLevel(v: string | null): v is Level {
  return v === "low" || v === "medium" || v === "high";
}
function isCapitalTier(v: string | null): v is CapitalTier {
  return v === "low" || v === "medium" || v === "high";
}
function isTimeCommitmentTier(v: string | null): v is TimeCommitmentTier {
  return v === "quick" || v === "moderate" || v === "intensive";
}

interface Props {
  opportunities: AirdropOpportunity[];
  chains: string[];
  categories: string[];
}

export default function OpportunityExplorer({ opportunities, chains, categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initial state is read once from the URL on mount, so a shared link like
  // /opportunities?chain=solana&capital=low lands on the right filters
  // immediately — no flash of the unfiltered list.
  const [chain, setChainRaw] = useState<string>(() => matchSlug(chains, searchParams.get("chain")) ?? "all");
  const [category, setCategoryRaw] = useState<string>(
    () => matchSlug(categories, searchParams.get("category")) ?? "all"
  );
  const [capital, setCapitalRaw] = useState<CapitalTier | "all">(() => {
    const v = searchParams.get("capital");
    return isCapitalTier(v) ? v : "all";
  });
  const [timeCommitment, setTimeCommitmentRaw] = useState<TimeCommitmentTier | "all">(() => {
    const v = searchParams.get("time");
    return isTimeCommitmentTier(v) ? v : "all";
  });
  const [risk, setRiskRaw] = useState<Level | "all">(() => {
    const v = searchParams.get("risk");
    return isLevel(v) ? v : "all";
  });
  const [tokenProbability, setTokenProbabilityRaw] = useState<Level | "all">(() => {
    const v = searchParams.get("tokenProbability");
    return isLevel(v) ? v : "all";
  });
  const [scoreFloor, setScoreFloorRaw] = useState<number>(() => {
    const v = Number(searchParams.get("minScore"));
    return SCORE_FLOORS.includes(v) ? v : 0;
  });
  // Sort order isn't treated as a "filter" for URL-sharing purposes — it
  // changes display order, not which opportunities are in the list.
  const [sort, setSort] = useState<SortKey>("score");

  /** Merges the given key/value pairs into the current URL's query string. A null/"all"/"0" value removes that key. */
  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) params.delete(key);
        else params.set(key, value);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setChain = (v: string) => {
    setChainRaw(v);
    updateQuery({ chain: v === "all" ? null : slugify(v) });
  };
  const setCategory = (v: string) => {
    setCategoryRaw(v);
    updateQuery({ category: v === "all" ? null : slugify(v) });
  };
  const setCapital = (v: string) => {
    const tier = isCapitalTier(v) ? v : "all";
    setCapitalRaw(tier);
    updateQuery({ capital: tier === "all" ? null : tier });
  };
  const setTimeCommitment = (v: string) => {
    const tier = isTimeCommitmentTier(v) ? v : "all";
    setTimeCommitmentRaw(tier);
    updateQuery({ time: tier === "all" ? null : tier });
  };
  const setRisk = (v: string) => {
    const level = isLevel(v) ? v : "all";
    setRiskRaw(level);
    updateQuery({ risk: level === "all" ? null : level });
  };
  const setTokenProbability = (v: string) => {
    const level = isLevel(v) ? v : "all";
    setTokenProbabilityRaw(level);
    updateQuery({ tokenProbability: level === "all" ? null : level });
  };
  const setScoreFloor = (v: string) => {
    const n = Number(v);
    setScoreFloorRaw(n);
    updateQuery({ minScore: n === 0 ? null : v });
  };

  const filtered = useMemo(() => {
    return opportunities.filter((op) => {
      if (chain !== "all" && op.chain !== chain) return false;
      if (category !== "all" && op.category !== category) return false;
      if (capital !== "all" && capitalBucket(op) !== capital) return false;
      if (timeCommitment !== "all" && timeCommitmentBucket(op) !== timeCommitment) return false;
      if (risk !== "all" && op.risk !== risk) return false;
      if (tokenProbability !== "all" && op.tokenProbability !== tokenProbability) return false;
      if (op.alphaScore < scoreFloor) return false;
      return true;
    });
  }, [opportunities, chain, category, capital, timeCommitment, risk, tokenProbability, scoreFloor]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sort) {
      case "score":
        return arr.sort((a, b) => b.alphaScore - a.alphaScore);
      case "ev":
        return arr.sort((a, b) => expectedValue(b) - expectedValue(a));
      case "evPerHour":
        return arr.sort((a, b) => evPerHour(b) - evPerHour(a));
      case "cost":
        return arr.sort((a, b) => a.estimatedCost.max - b.estimatedCost.max);
      case "time":
        return arr.sort((a, b) => a.estimatedTimeMinutesPerWeek - b.estimatedTimeMinutesPerWeek);
      case "tokenProbability": {
        const rank: Record<Level, number> = { high: 2, medium: 1, low: 0 };
        return arr.sort((a, b) => rank[b.tokenProbability] - rank[a.tokenProbability]);
      }
      case "recent":
        return arr.sort((a, b) => (a.lastUpdated < b.lastUpdated ? 1 : -1));
      default:
        return arr;
    }
  }, [filtered, sort]);

  const resetFilters = () => {
    setChainRaw("all");
    setCategoryRaw("all");
    setCapitalRaw("all");
    setTimeCommitmentRaw("all");
    setRiskRaw("all");
    setTokenProbabilityRaw("all");
    setScoreFloorRaw(0);
    router.replace(pathname, { scroll: false });
  };

  const activeFilterCount =
    [chain, category, capital, timeCommitment, risk, tokenProbability].filter((v) => v !== "all").length +
    (scoreFloor > 0 ? 1 : 0);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Select label="Chain" value={chain} onChange={setChain} options={toOptions(["all", ...chains])} />
        <Select label="Category" value={category} onChange={setCategory} options={toOptions(["all", ...categories])} />
        <Select
          label="Capital"
          value={capital}
          onChange={setCapital}
          options={[{ value: "all", label: "all" }, ...CAPITAL_OPTIONS]}
        />
        <Select
          label="Time commitment"
          value={timeCommitment}
          onChange={setTimeCommitment}
          options={[{ value: "all", label: "all" }, ...TIME_COMMITMENT_OPTIONS]}
        />
        <Select label="Risk" value={risk} onChange={setRisk} options={toOptions(["all", ...LEVELS])} />
        <Select
          label="Token prob."
          value={tokenProbability}
          onChange={setTokenProbability}
          options={toOptions(["all", ...LEVELS])}
        />
        <Select
          label="Min score"
          value={String(scoreFloor)}
          onChange={setScoreFloor}
          options={SCORE_FLOORS.map((n) => ({ value: String(n), label: n === 0 ? "all" : `${n}+` }))}
        />
        {activeFilterCount > 0 && (
          <button onClick={resetFilters} className="text-xs text-signal-amber hover:underline ml-1">
            Clear all filters ({activeFilterCount})
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-paper-500">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-ink-800 border border-ink-600 rounded-md text-sm px-2 py-1.5 text-paper-100 focus:outline-none focus:ring-1 focus:ring-signal-amber"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-paper-500 mb-4">
        Showing {sorted.length} of {opportunities.length} opportunities
      </p>

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-600 py-16 text-center text-paper-500">
          <p className="font-display text-paper-100 mb-1">Nothing matches those filters.</p>
          <p className="text-sm">Try widening your criteria — or clear filters to see everything tracked.</p>
          <button onClick={resetFilters} className="mt-4 text-sm text-signal-amber hover:underline">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((op) => (
            <OpportunityCard key={op.id} op={op} />
          ))}
        </div>
      )}
    </div>
  );
}

function toOptions(values: string[]): { value: string; label: string }[] {
  return values.map((v) => ({ value: v, label: v }));
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-1.5 bg-ink-800 border border-ink-600 rounded-md px-2 py-1.5 text-sm">
      <span className="text-[11px] uppercase tracking-wide text-paper-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-paper-100 focus:outline-none capitalize"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-ink-800 capitalize">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
