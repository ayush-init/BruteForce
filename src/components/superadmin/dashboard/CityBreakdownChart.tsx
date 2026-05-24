"use client";

import { motion } from "framer-motion";
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from './CustomTooltip';

interface CityBreakdownChartProps {
  cityBreakdown: { name: string; count: number }[];
}

export function CityBreakdownChart({ cityBreakdown }: CityBreakdownChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="md:col-span-2 glass rounded-2xl backdrop-blur-2xl p-3  border border-border/20"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-logo" />
          City Overview
        </h3>

        <span className="text-xs text-muted-foreground">
          All cities data
        </span>
      </div>

      {/* Chart */}
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={cityBreakdown}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            barSize={50}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 3"
              vertical={false}
              opacity={1}
            />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 13 }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              width={40}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "var(--chart-2)", fillOpacity: 0.08 }}
            />

            <Bar
              dataKey="count"
              radius={[6, 6, 0, 0]}
              fill="var(--chart-1)"
              animationDuration={700}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/10">
        <div className="w-3 h-3 rounded-sm bg-chart-1"></div>
        <span className="text-xs text-muted-foreground/50">
          Batches per city
        </span>
      </div>
    </motion.div>
  );
}
