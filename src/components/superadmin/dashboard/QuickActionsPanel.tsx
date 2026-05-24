"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowUpRight, UserPlus, MapPin, FolderPlus } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface QuickActionItem {
  label: string;
  icon: LucideIcon;
  href: string;
  hoverBorderColor: string;
}

const actions: QuickActionItem[] = [
  {
    label: 'Add Admin',
    icon: UserPlus,
    href: '/superadmin/admins',
    hoverBorderColor: 'hover:border-chart-5/40',
  },
  {
    label: 'Add City',
    icon: MapPin,
    href: '/superadmin/cities',
    hoverBorderColor: 'hover:border-chart-2/40',
  },
  {
    label: 'Add Batch',
    icon: FolderPlus,
    href: '/superadmin/batches',
    hoverBorderColor: 'hover:border-chart-3/40',
  },
];

export function QuickActionsPanel() {
  const router = useRouter();

  return (
    <div className="glass backdrop-blur-2xl h-full rounded-2xl p-5 border border-border/20">

      <h3 className="text-base font-semibold text-foreground mb-7 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-logo animate-pulse"></div>
        <Sparkles className="h-4 w-4 text-logo" />
        Quick Actions
      </h3>

      <div className="space-y-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => router.push(action.href)}
            className="w-full flex items-center justify-between px-4 py-4 rounded-2xl border border-border/60
       hover:border-chart-3/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 
    border border-logo/20 bg-logo/5 rounded">
                <action.icon className="h-4 w-4 text-logo " />
              </div>
              <span className="text-xl text-muted-foreground mt-2 ">{action.label}</span>
            </div>
            <ArrowUpRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition" />
          </button>
        ))}
      </div>
    </div>
  );
}
