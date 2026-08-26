import { scoreTier } from "@/lib/scoring";

const TONE_COLOR: Record<string, string> = {
  amber: "#E8A33D",
  teal: "#4FD1B5",
  rose: "#E1667C",
};

export default function ScoreGauge({
  score,
  size = 96,
}: {
  score: number;
  size?: number;
}) {
  const tier = scoreTier(score);
  const color = TONE_COLOR[tier.tone];
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = circumference * pct;
  const ticks = Array.from({ length: 24 });

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Alpha score ${score} out of 100, ${tier.label}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {ticks.map((_, i) => {
          const angle = (i / ticks.length) * 360;
          const active = angle <= pct * 360;
          return (
            <line
              key={i}
              x1={50}
              y1={6}
              x2={50}
              y2={11}
              stroke={active ? color : "#232A3F"}
              strokeWidth={1.5}
              transform={`rotate(${angle} 50 50)`}
            />
          );
        })}
        <circle cx="50" cy="50" r={radius} stroke="#171C2C" strokeWidth={6} fill="none" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={color}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-600 text-2xl tabular leading-none" style={{ color }}>
          {score}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-paper-500 mt-0.5">/ 100</span>
      </div>
    </div>
  );
}
