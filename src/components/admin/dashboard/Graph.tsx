"use client";

import { ReactNode } from "react";
import { BarChart3, Target, Globe } from "lucide-react";
import DifficultyChart from "@/components/admin/charts/DifficultyChart";
import PlatformChart from "@/components/admin/charts/PlatformChart";
import TypeChart from "@/components/admin/charts/Type";
import { AdminStats } from "@/types/admin/dashboard.types";

interface GraphProps {
  stats: AdminStats | null;
}

interface CardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

export default function Graph({ stats }: GraphProps) {
  return (

    
    <div className="grid  grid-cols-1 lg:grid-cols-3 gap-6">
      {/* DIFFICULTY */}
      <Card title="Difficulty" icon={<BarChart3 />}>
        <DifficultyChart data={stats?.questions_by_level} />
      </Card>

      {/* TYPE */}
      <Card title="Type" icon={<Target />}>
        <TypeChart data={stats?.questions_by_type} />
      </Card>

      {/* PLATFORM */}
      <Card title="Platform" icon={<Globe />}>
        <PlatformChart data={stats?.questions_by_platform} />
      </Card>
    </div>
  );
}

function Card({ title, icon, children }: CardProps) {
  return (
    <div className="glass  hover-glow rounded-2xl overflow-hidden">

      <div className="px-6 py-4 flex items-center gap-3 border-b border-border/40">
        <div className="text-logo">{icon}</div>
        <h3 className="font-semibold">{title}</h3>
      </div>

      <div className="p-6 space-y-5">
        {children}
      </div>

    </div>
  );
}
