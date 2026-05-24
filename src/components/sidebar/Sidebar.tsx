"use client";

import React from "react";
import { LogOut, LucideIcon, ChevronRight, Link } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarItem } from "./SidebarItem";
import Logo from "@/components/Logo";

export interface SidebarNavItems {
  href: string;
  label: string;
  icon: LucideIcon;
  showDivider?: boolean;
  dividerLabel?: string;
}

interface SidebarProps {
  role: "admin" | "superadmin";
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; role: string; email?: string } | null;
  navItems: SidebarNavItems[];
  onLogout: () => void;
  portalLabel?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  isOpen,
  onClose,
  user,
  navItems,
  onLogout,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <>
      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <motion.aside
        layout
        initial={false}
        animate={{
          x: isOpen ? 0 : "-100%",
          width: isCollapsed ? 72 : 260,
        }}
        transition={{
          x: { type: "spring", stiffness: 250, damping: 25 },
          width: { type: "spring", stiffness: 300, damping: 30 },
        }}
        className={`
          fixed lg:relative top-0 left-0 h-screen
          flex z-40 lg:z-20
          overflow-hidden
          ${isCollapsed ? "p-2" : "p-3"}
          ${isOpen ? "block" : "hidden lg:block"}
        `}
      >
        {/* GLASS CONTAINER */}
        <motion.div
          layout
          className="relative h-full w-full flex flex-col rounded-2xl glass overflow-hidden no-scrollbar  "
        >

          {/* HEADER — locked to h-14 so its vertical centre matches the
              top-right page header (which is also h-14) for the
              admin / superadmin layouts. Both share the same `mt-3 / p-3`
              outer offset, so equal heights → centres line up exactly. */}
          <motion.div
            layout
            className={`
              h-14 px-4 pt-6 pb-12 flex items-center
              ${isCollapsed ? "justify-center" : "justify-between"}
            `}
          >
           
            <motion.h1
              layout="position"
              initial={false}
              animate={{
                opacity: isCollapsed ? 0 : 1,
                width: isCollapsed ? 0 : "auto",
              }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              aria-label="BruteForce"
              className="flex items-center overflow-hidden whitespace-nowrap [&_svg]:!w-[165px] [&_svg]:!h-[65px]"
            >
              <Logo />
            </motion.h1>

            {/* TOGGLE BUTTON */}
            <motion.button
              layout="position"
              onClick={onToggleCollapse}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="
                flex items-center justify-center
                h-8 w-8 rounded-2xl
                bg-[var(--glass-bg)]
                backdrop-blur-md
                border border-[var(--glass-border)]
                text-muted-foreground
                transition-colors duration-200
                hover:text-foreground
                hover:shadow-[0_0_12px_var(--hover-glow)]
                shrink-0
              "
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 0 : 180 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            </motion.button>
          </motion.div>

          {/* NAV */}
          <motion.nav
            layout
            className={`
              flex-1 space-y-1 overflow-y-auto custom-scrollbar
              ${isCollapsed ? "py-4" : "px-2 py-4"}
            `}
          >
            {navItems.map((item) => (
              <SidebarItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                showDivider={item.showDivider}
                dividerLabel={item.dividerLabel}
                isCollapsed={isCollapsed}
              />
            ))}
          </motion.nav>

          {/* USER SECTION (ANIMATED) */}
          <AnimatePresence>
            {!isCollapsed && user && (
              <motion.div
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="border-t border-border p-3 pt-4"
              >
                <motion.button
                  layout
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onLogout}
                  className="
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg
                    text-muted-foreground hover:text-foreground
                    hover:bg-[rgba(204,255,0,0.05)]
                    hover:shadow-[0_0_12px_var(--hover-glow)]
                    transition-all duration-200
                  "
                >
                  <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center font-bold text-sm uppercase">
                    {user.name?.charAt(0) || "A"}
                  </div>

                  <div className="text-left flex-1 min-w-0">
                    <div className="text-sm font-medium truncate text-foreground">
                      {user.name || "Admin"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Logout Session
                    </div>
                  </div>

                  <LogOut className="w-5 h-5 opacity-70" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* COLLAPSED USER ICON */}
          <AnimatePresence>
            {isCollapsed && user && (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="p-3 pt-4 border-t border-border flex justify-center"
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onLogout}
                  className="
                    w-10 h-10 rounded-lg bg-muted flex items-center justify-center
                    hover:bg-[rgba(204,255,0,0.1)]
                    transition-colors duration-200
                  "
                >
                  {user.name?.charAt(0) || "A"}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.aside>
    </>
  );
}
