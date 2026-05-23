"use client";
import React from 'react';
import { LeetCodeIcon, GeeksforGeeksIcon } from '@/components/platform/PlatformIcons';
import { Button } from '../../../../app/(auth)/shared/components/Button';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { OnboardingStep3Props } from '@/types/student/index.types';

export function OnboardingStep3({ data, setStep, confirmChecked, setConfirmChecked, submitOnboarding, loading }: OnboardingStep3Props) {

  const handleEdit = () => {
    setStep(2);
  };

  return (
    <div className="space-y-4">

      {/* ⚠️ WARNING */}
      <div className="
      flex gap-2
      bg-destructive/10
      border border-destructive/20
      text-destructive
      text-[11px] font-medium
      px-2 rounded-2xl py-3
    ">
        <AlertTriangle className="w-3.5 h-3.5 mt-[2px]" />

        <p className="leading-snug">
          Ensure usernames are correct.
          <span className="font-semibold"> Cannot be changed later.</span>
        </p>
      </div>

      {/* 🔗 PROFILE CARDS */}
      <div className="space-y-2">

        {/* LEETCODE */}
        <div className="
        flex justify-between items-center
        px-3 py-2.5
        rounded-2xl glass
        border border-border/60
      ">
          <div className="space-y-[2px]">
            <p className="text-[9px] font-semibold uppercase text-muted-foreground flex items-center gap-2">
              <LeetCodeIcon className="w-3 h-3 text-leetcode" />
              LeetCode
            </p>

            <p
              className="text-sm font-medium truncate max-w-[140px]"
              title={data.leetcode_id}
            >
              {data.leetcode_id}
            </p>
          </div>
          <a
            href={`https://leetcode.com/u/${data.leetcode_id}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded  bg-primary text-primary-foreground
    border border-primary/30   hover:brightness-110  hover:shadow-[0_0_10px_var(--hover-glow)]  transition-all duration-200 active:scale-[0.96]"
          >
            <span>View</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* GFG */}
        <div className="
        flex justify-between items-center
        px-3 py-2.5
        rounded-2xl glass
        border border-border/60
      ">
          <div className="space-y-[2px]">
            <p className="text-[9px] font-semibold uppercase text-muted-foreground flex items-center gap-2">
              <GeeksforGeeksIcon className="w-3 h-3 text-gfg" />
              GFG
            </p>

            <p
              className="text-sm font-medium truncate max-w-[140px]"
              title={data.gfg_id}
            >
              {data.gfg_id}
            </p>
          </div>

          <a
            href={`https://auth.geeksforgeeks.org/user/${data.gfg_id}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="
    inline-flex items-center gap-1.5

    text-[11px] font-medium
    px-3 py-1.5 rounded

    bg-primary text-primary-foreground
    border border-primary/30

    hover:brightness-110
    hover:shadow-[0_0_10px_var(--hover-glow)]

    transition-all duration-200
    active:scale-[0.96]
  "
          >
            <span>View</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* ✅ CHECKBOX */}
      {/* Align checkbox + label on the same baseline. The previous
          `items-start` + manual `mt-[3px]` was trying to nudge a small
          checkbox up against multi-line text, but the checkbox actually
          renders larger than declared (browser/native styling), so the
          mismatch showed up as the box sitting visibly above the label.
          `items-center` + a fixed checkbox box-size now line them up. */}
      <div className="flex items-center gap-2 pt-1">

        <input
          type="checkbox"
          id="confirmData"
          checked={confirmChecked}
          onChange={(e) => setConfirmChecked(e.target.checked)}
          className="w-4 h-4 shrink-0 accent-primary cursor-pointer"
        />

        <label
          htmlFor="confirmData"
          className="text-xs text-muted-foreground leading-none cursor-pointer"
        >
          I confirm these profiles are correct.
        </label>
      </div>

      {/* 🔘 ACTIONS */}
      <div className="flex gap-2 pt-2">

        <Button
          variant="outline"
          onClick={handleEdit}
          disabled={loading}
          className="
          w-1/3 h-10
          rounded-lg
          text-sm font-medium

          border-border
          hover:bg-accent/50

          transition
          active:scale-[0.97]
        "
        >
          Edit
        </Button>

        <Button
          onClick={submitOnboarding}
          disabled={!confirmChecked || loading}
          className="
          w-2/3 h-10
          rounded-lg
          text-sm font-medium

          bg-primary text-primary-foreground

          hover:shadow-[0_0_15px_var(--hover-glow)]
          transition
          active:scale-[0.97]

          disabled:opacity-50
        "
        >
          {loading ? "Saving..." : "Confirm & Continue"}
        </Button>
      </div>
    </div>
  );
}
