import { Level } from "@/lib/types";

const LEVEL_STYLE: Record<Level, string> = {
  low: "bg-signal-tealDim text-signal-teal",
  medium: "bg-signal-amberDim text-signal-amber",
  high: "bg-signal-roseDim text-signal-rose",
};

/** For "competition" and "risk", low is good; for "tokenProbability", high is good. Pass invert to flip the color mapping. */
export function LevelBadge({ level, invert = false }: { level: Level; invert?: boolean }) {
  const mapped: Level = invert ? (level === "low" ? "high" : level === "high" ? "low" : "medium") : level;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${LEVEL_STYLE[mapped]}`}>
      {level}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize bg-ink-700 text-paper-300 border border-ink-600">
      {status}
    </span>
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-ink-800 text-paper-500 border border-ink-600">
      {children}
    </span>
  );
}
