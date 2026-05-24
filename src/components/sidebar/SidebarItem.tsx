"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";

interface SidebarItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive?: boolean;
  showDivider?: boolean;
  dividerLabel?: string;
  isCollapsed?: boolean;
}

export function SidebarItem({
  href,
  label,
  icon: Icon,
  isActive,
  showDivider,
  dividerLabel,
  isCollapsed,
}: SidebarItemProps) {
  const pathname = usePathname();

  const active =
    isActive ??
    (pathname === href ||
      (pathname.startsWith(href) &&
        href !== "/admin" &&
        href !== "/superadmin"));

  return (
    <>
      {/* Divider — kept tight (pt-3 not pt-5) so the gap above the
          "Management" label matches the gap between Dashboard and the
          top of the nav. The old pt-5 / pb-2 was visibly lopsided. */}
      {showDivider && !isCollapsed && (
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-mono px-3 pt-3 pb-2">
          {dividerLabel}
        </div>
      )}

      {/* Item */}
      <Link
        href={href}
        className={`
           relative flex items-center
          ${isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2"}
          rounded-lg text-sm font-medium
          transition-all duration-200 ease-in-out

          ${
            active
              ? `
                text-primary
                
          
              `
              : `
                text-foreground/80
                hover:text-primary
                hover:bg-[rgba(204,255,0,0.05)]
                hover:shadow-[0_0_10px_rgba(204,255,0,0.12)]
              `
          }
        `}
        title={isCollapsed ? label : undefined}
      >
        {/* Active Neon Indicator */}
        {active && (
          <span
            className={`
              absolute left-0 top-1/2 -translate-y-1/2
              h-5 w-[3px] rounded-r-full bg-primary
              shadow-[0_0_12px_rgba(204,255,0,0.9)]
              ${isCollapsed ? "hidden" : ""}
            `}
          />
        )}

        {/* Icon */}
        <Icon
          className={`
            ${isCollapsed ? "w-5 h-5" : "w-5 h-5"}
            flex-shrink-0
            transition-all duration-200

            ${
              active
                ? "text-primary drop-shadow-[0_0_10px_rgba(204,255,0,0.9)]"
                : "text-foreground/80 group-hover:text-primary group-hover:drop-shadow-[0_0_8px_rgba(204,255,0,0.6)]"
            }
          `}
        />

        {/* Label */}
        {!isCollapsed && (
          <span className="truncate">{label}</span>
        )}
      </Link>
    </>
  );
}
