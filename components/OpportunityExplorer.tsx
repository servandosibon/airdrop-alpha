"use client";

import { useMemo, useState } from "react";
import { AirdropOpportunity, Level } from "@/lib/types";
import { evPerHour, expectedValue } from "@/lib/scoring";
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

function costBucket(op: AirdropOpportunity): string {
  const max = op.estimatedCost.max;
  if (max === 0) return "Free";
  if (max < 10) return "<$10";
  if (max <= 50) return "$10–50";
  return "$50+";
}
const COST_BUCKETS = ["Free", "<$10", "$10–50", "$50+"];

function timeBucket(op: AirdropOpportunity): string {
  const m = op.estimatedTimeMinutesPerWeek;
  if (m < 30) return "<30 min";
  if (m <= 60) return "30–60 min";
  if (m <= 180) return "1–3 hours";
  return "3+ hours";
}
const TIME_BUCKETS = ["<30 min", "30–60 min", "1–3 hours", "3+ hours"];

interface Props {
  opportunities: AirdropOpportunity[];
  chains: string[];
  categories: string[];
}

export default function OpportunityExplorer({ opportunities, chains, categories }: Props) {
  const [chain, setChain] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [cost, setCost] = useState<string>("all");
  const [time, setTime] = useState<string>("all");
  const [risk, setRisk] = useState<Level | "all">("all");
  const [tokenProbability, setTokenProbability] = useState<Level | "all">("all");
  const [scoreFloor, setScoreFloor] = useState<number>(0);
  const [sort, setSort] = useState<SortKey>("score");

  const filtered = useMemo(() => {
    return opportunities.filter((op) => {
      if (chain !== "all" && op.chain !== chain) return false;
      if (category !== "all" && op.category !== category) return false;
      if (cost !== "all" && costBucket(op) !== cost) return false;
      if (time !== "all" && timeBucket(op) !== time) return false;
      if (risk !== "all" && op.risk !== risk) return false;
      if (tokenProbability !== "all" && op.tokenProbability !== tokenProbability) return false;
      if (op.alphaScore < scoreFloor) return false;
      return true;
    });
  }, [opportunities, chain, category, cost, time, risk, tokenProbability, scoreFloor]);

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
    setChain("all");
    setCategory("all");
    setCost("all");
    setTime("all");
    setRisk("all");
    setTokenProbability("all");
    setScoreFloor(0);
  };

  const activeFilterCount = [chain, category, cost, time, risk, tokenProbability].filter((v) => v !== "all").length + (scoreFloor > 0 ? 1 : 0);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Select label="Chain" value={chain} onChange={setChain} options={["all", ...chains]} />
        <Select label="Category" value={category} onChange={setCategory} options={["all", ...categories]} />
        <Select label="Cost" value={cost} onChange={setCost} options={["all", ...COST_BUCKETS]} />
        <Select label="Time" value={time} onChange={setTime} options={["all", ...TIME_BUCKETS]} />
        <Select label="Risk" value={risk} onChange={(v) => setRisk(v as Level | "all")} options={["all", ...LEVELS]} />
        <Select
          label="Token prob."
          value={tokenProbability}
          onChange={(v) => setTokenProbability(v as Level | "all")}
          options={["all", ...LEVELS]}
        />
        <Select
          label="Min score"
          value={String(scoreFloor)}
          onChange={(v) => setScoreFloor(Number(v))}
          options={SCORE_FLOORS.map(String)}
          optionLabel={(v) => (v === "0" ? "all" : `${v}+`)}
        />
        {activeFilterCount > 0 && (
          <button onClick={resetFilters} className="text-xs text-signal-amber hover:underline ml-1">
            Clear filters ({activeFilterCount})
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
            Clear filters
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

function Select({
  label,
  value,
  onChange,
  options,
  optionLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  optionLabel?: (v: string) => string;
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
          <option key={o} value={o} className="bg-ink-800 capitalize">
            {optionLabel ? optionLabel(o) : o}
          </option>
        ))}
      </select>
    </label>
  );
}
