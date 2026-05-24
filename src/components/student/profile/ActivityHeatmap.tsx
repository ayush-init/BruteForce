import React, { useMemo } from "react";
import { Activity } from "lucide-react";

interface HeatmapData {
  date: string;
  count: number;
}

interface Props {
  heatmap: HeatmapData[];
  currentStreak?: number;
  maxStreak?: number;
}

export default function ActivityHeatmap({
  heatmap,
  currentStreak,
  maxStreak,
}: Props) {

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ✅ Start from 12 months ago
  const startDate = new Date(today);
  startDate.setFullYear(today.getFullYear() - 1);

  // ✅ Align to Sunday
  const day = startDate.getDay();
  startDate.setDate(startDate.getDate() - day);

  // ✅ Map for O(1)
  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    heatmap.forEach((d) => {
      const key = d.date.split("T")[0];
      map.set(key, d.count);
    });
    return map;
  }, [heatmap]);

  // ✅ Generate dates
  const allDates: Date[] = [];
  const current = new Date(startDate);
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    allDates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // ✅ Weeks
  const weeks: Date[][] = [];
  let week: Date[] = [];

  allDates.forEach((date) => {
    week.push(date);
    if (date.getDay() === 6) {
      weeks.push(week);
      week = [];
    }
  });

  if (week.length) weeks.push(week);

  // 🎨 Primary-based color intensity
  const getColor = (count: number) => {
    if (count === -1)
      return "bg-blue-100/50 border border-blue-200/50"; // Freeze day color

    if (count <= 0)
      return "bg-[var(--muted)] border border-[var(--border)]";

    if (count <= 2) return "bg-logo/40";
    if (count <= 5) return "bg-logo/60";
    if (count <= 10) return "bg-logo/90";

    return "bg-logo";
  };

  // 📅 Month labels
  const months: { label: string; index: number }[] = [];
  weeks.forEach((week, i) => {
    const firstDay = week[0];
    const month = firstDay.getMonth();

    if (i === 0 || month !== weeks[i - 1][0].getMonth()) {
      months.push({
        label: firstDay.toLocaleString("default", { month: "short" }),
        index: i,
      });
    }
  });

  return (
    <div className="glass backdrop-blur-sm p-6 rounded-[var(--radius-lg)] border border-[var(--border)] w-full">

      {/* Header */}
      <div className="flex justify-between items-center ">
        <h3 className="font-bold mb-6 flex items-center gap-2 text-[var(--text-base)] text-[var(--foreground)]">
          <Activity className="w-5 h-5 text-logo" />
          Activity
        </h3>
      </div>

      {/* Heatmap */}
      <div className="w-full overflow-x-auto overflow-y-visible pb-2 sm:overflow-visible sm:pb-0">
        <div className="flex min-w-[760px] gap-3 sm:min-w-0">

          {/* Week Labels (FIXED ALIGNMENT) */}
          <div className="relative w-8 shrink-0 text-[13px] text-[var(--muted-foreground)] ">
            <span className="absolute top-[42px] ">Mon</span>
            <span className="absolute top-[76px]">Wed</span>
            <span className="absolute top-[112px]">Fri</span>
          </div>

          <div className="flex w-full flex-col ms-5">

            {/* Months (PERFECT ALIGNMENT) */}
            <div className="flex mb-2 text-[11px] text-[var(--muted-foreground)]">
              {weeks.map((_, i) => (
                <div key={i} className="flex-1 text-center">
                  {months.find((m) => m.index === i)?.label || ""}
                </div>
              ))}
            </div>

            {/* Grid (PERFECT SPACING) */}
            <div className="flex w-full justify-between ">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[4px] flex-1 items-center">
                  {Array.from({ length: 7 }).map((_, di) => {
                    const date = week[di];

                    if (!date)
                      return <div className="w-[14px] h-[14px]" key={di} />;

                    const key = date.toLocaleDateString("en-CA");
                    const count = dataMap.get(key) ?? 0;
                    const prettyDate = date.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    });
                    const tooltipText =
                      count === -1
                        ? `Freeze day on ${prettyDate}`
                        : `${count} ${count === 1 ? "submission" : "submissions"} on ${prettyDate}`;
                    return (
                      <div
                        key={di}
                        className={`relative group w-[14px] h-[14px] rounded-[3px] ${getColor(count)} cursor-pointer`}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium whitespace-nowrap bg-[#1f2937] text-white rounded-2xl border border-white/10 shadow-xl pointer-events-none z-[9999] opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          {tooltipText}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between mt-5 text-sm text-[var(--muted-foreground)]">
        <span>
          {heatmap.filter((d) => d.count > 0).length} active days
        </span>
        <span>
          {heatmap.reduce((a, b) => a + Math.max(0, b.count), 0)} total
        </span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-xs text-[var(--muted-foreground)]">
        <span>Less</span>
        <div className="w-[14px] h-[14px] bg-[var(--muted)] border border-[var(--border)] rounded-[3px]" />
        <div className="w-[14px] h-[14px] bg-logo/20 rounded-[3px]" />
        <div className="w-[14px] h-[14px] bg-logo/40 rounded-[3px]" />
        <div className="w-[14px] h-[14px] bg-logo/70 rounded-[3px]" />
        <div className="w-[14px] h-[14px] bg-logo rounded-[3px]" />
        <span>More</span>
        <span className="ml-4 text-[var(--muted-foreground)]">|</span>

        <div className="w-[14px] h-[14px] bg-blue-100/50 border border-blue-200/50 rounded-[3px]" />
        <span>Freeze day</span>
      </div>

    </div>
  );
}
