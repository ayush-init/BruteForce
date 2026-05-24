"use client";

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  subtitle: string;
  onClick: () => void;
  ringColor: string;
  chartColor: string;
}

export function StatCard({ title, value, icon: Icon, subtitle, onClick, ringColor, chartColor }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      tabIndex={0}
      className="backdrop-blur-2xl cursor-pointer glass p-4 rounded-2xl 
  transition-all duration-300 border border-border/20 
  relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-chart-2/40"
    >
      {/* subtle hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-br from-chart-2/10 to-transparent" />

      <div className="flex items-center justify-between mb-2 relative">
        <h3 className="text-xl font-bold text-muted-foreground">{title}</h3>

        <div className="p-2 rounded bg-logo/5 border border-logo/10 
    group-hover:scale-110 transition">
          <Icon className="h-4 w-4 text-logo" />
        </div>
      </div>

      <div className={`text-2xl font-semibold tracking-tight text-foreground 
  group-hover:text-${chartColor} transition relative`}>
        {value}
      </div>

      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
        <span>{subtitle}</span>
      </div>
    </div>
  );
}
