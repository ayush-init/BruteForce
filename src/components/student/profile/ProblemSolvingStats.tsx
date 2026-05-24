// src/components/student/profile/ProblemSolvingStats.tsx
import React, { useEffect, useState } from "react";
import { TrendingUp, Info } from "lucide-react";

interface ProblemSolvingStatsProps {
  codingStats?: {
    totalSolved?: number;
    easy?: { solved?: number; assigned?: number };
    medium?: { solved?: number; assigned?: number };
    hard?: { solved?: number; assigned?: number };
  };
}

function SegmentedGauge({
  value = 0,
  total = 100,
  color = "#a3e635",
  label,
}: {
  value?: number;
  total?: number;
  color?: string;
  label: string;
}) {
  const percentage = total ? (value / total) * 100 : 0;
  const segments = 20; // number of bars
  const filledSegments = Math.round((percentage / 100) * segments);

  const [activeSegments, setActiveSegments] = useState(0);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setActiveSegments(i);
      if (i >= filledSegments) clearInterval(interval);
    }, 40); // speed of animation

    return () => clearInterval(interval);
  }, [filledSegments]);

  const radius = 70;
  const center = 80;

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-(--radius-lg) bg-[var(--accent-secondary)] ">
      <svg width="160" height="100" viewBox="0 0 160 100">
        {Array.from({ length: segments }).map((_, i) => {
          const angle = (i / (segments - 1)) * Math.PI; // semi-circle
          const x1 = center + Math.cos(Math.PI - angle) * (radius - 10);
          const y1 = 80 - Math.sin(angle) * (radius - 10);

          const x2 = center + Math.cos(Math.PI - angle) * radius;
          const y2 = 80 - Math.sin(angle) * radius;

          const isActive = i < activeSegments;

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isActive ? color : "#2a2a2a"}
              strokeWidth="8"
              strokeLinecap="round"
              style={{
                transition: "all 0.3s ease",
                filter: isActive
                  ? "drop-shadow(0 0 6px var(--easy))"
                  : "none",
              }}
            />
          );
        })}
      </svg>

      {/* Center text */}
      <div className="-mt-8 text-center">
        <div className="text-xl font-bold text-[var(--foreground)]">
          {Math.round(percentage)}%
        </div>
        <div className="text-xs text-[var(--text-secondary)]">
          {value} / {total}
        </div>
      </div>

      {/* Label */}
      <div className="mt-3 text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}

export function ProblemSolvingStats({ codingStats }: ProblemSolvingStatsProps) {
  return (
    <div className="glass backdrop-blur-sm p-6 rounded-(--radius-lg)">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="font-bold mb-2 flex items-center gap-3 text-[var(--text-3xl)] text-[var(--foreground)]">
            <TrendingUp className="w-8 h-8 text-logo" />
            Problem Solving Stats
          </h2>
          <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
            Track your DSA journey across all difficulty levels.
          </p>
        </div>

        <div className="text-right">
          <div className="font-black text-[40px] text-primary">
            {codingStats?.totalSolved || 0}
          </div>
          <div className="font-mono mt-1 text-[var(--text-xs)] text-[var(--text-secondary)] uppercase tracking-[0.1em]">
            Total Solved
          </div>
        </div>
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SegmentedGauge
          value={codingStats?.easy?.solved}
          total={codingStats?.easy?.assigned}
          color="var(--easy)"
          label="Easy"
        />

        <SegmentedGauge
          value={codingStats?.medium?.solved}
          total={codingStats?.medium?.assigned}
          color="var(--medium)"
          label="Medium"
        />

        <SegmentedGauge
          value={codingStats?.hard?.solved}
          total={codingStats?.hard?.assigned}
          color="var(--hard)"
          label="Hard"
        />
      </div>

     
    </div>
  );
}
