"use client";

import { useEffect, useState } from "react";
import { FarmingStep } from "@/lib/types";

function storageKey(slug: string) {
  return `airdrop_alpha_completed_steps_${slug}`;
}

function readCompleted(slug: string): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function writeCompleted(slug: string, indices: number[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(slug), JSON.stringify(indices));
}

export default function FarmingStepChecklist({ slug, steps }: { slug: string; steps: FarmingStep[] }) {
  const [completed, setCompleted] = useState<number[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCompleted(readCompleted(slug));
    setMounted(true);
  }, [slug]);

  const toggleStep = (index: number) => {
    setCompleted((prev) => {
      const next = prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index];
      writeCompleted(slug, next);
      return next;
    });
  };

  const resetProgress = () => {
    setCompleted([]);
    writeCompleted(slug, []);
  };

  const total = steps.length;
  const done = mounted ? completed.filter((i) => i < total).length : 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-paper-300 tabular">
          {done} of {total} steps completed ({pct}%)
        </span>
        {mounted && done > 0 && (
          <button onClick={resetProgress} className="text-xs text-signal-rose hover:underline">
            Reset progress
          </button>
        )}
      </div>
      <div className="h-1.5 rounded-full bg-ink-700 overflow-hidden mb-4">
        <div className="h-full bg-signal-teal rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>

      <ol className="space-y-3">
        {steps.map((step, i) => {
          const checked = mounted && completed.includes(i);
          return (
            <li
              key={i}
              className={`flex gap-4 rounded-lg border p-4 transition-colors ${
                checked ? "border-signal-tealDim bg-signal-tealDim/10" : "border-ink-600 bg-ink-800"
              }`}
            >
              <button
                onClick={() => toggleStep(i)}
                aria-pressed={checked}
                aria-label={checked ? `Mark "${step.title}" as not done` : `Mark "${step.title}" as done`}
                className={`w-6 h-6 mt-0.5 flex-shrink-0 rounded border flex items-center justify-center text-xs transition-colors ${
                  checked
                    ? "bg-signal-teal border-signal-teal text-ink-950"
                    : "border-ink-500 text-transparent hover:border-paper-500"
                }`}
              >
                ✓
              </button>
              <div className="min-w-0">
                <div className={`font-medium ${checked ? "text-paper-300 line-through opacity-70" : "text-paper-100"}`}>
                  {step.title}
                </div>
                <p className={`text-sm text-paper-500 mt-0.5 ${checked ? "line-through opacity-70" : ""}`}>
                  {step.description}
                </p>
                <div className="flex gap-3 mt-1.5 text-xs text-paper-500 font-mono">
                  {step.estimatedCost && <span>cost: {step.estimatedCost}</span>}
                  {step.estimatedTime && <span>time: {step.estimatedTime}</span>}
                  {step.url && (
                    <a href={step.url} target="_blank" rel="noopener noreferrer" className="text-signal-teal hover:underline">
                      link ↗
                    </a>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
