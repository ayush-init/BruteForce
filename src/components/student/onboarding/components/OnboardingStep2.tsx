"use client";
import React from 'react';
import { LeetCodeIcon, GeeksforGeeksIcon } from '@/components/platform/PlatformIcons';
import { Input } from '../../../../app/(auth)/shared/components/Input';
import { Button } from '../../../../app/(auth)/shared/components/Button';
import { OnboardingStep2Props } from '@/types/student/index.types';

export function OnboardingStep2({ data, setData, setStep }: OnboardingStep2Props) {
  return (
    <div className=" space-y-6">

      {/* FORM */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (data.leetcode_id && data.gfg_id) setStep(3);
        }}
        className="space-y-6"
      >

        {/* LEETCODE */}
        <div className="space-y-3 p-4 rounded-2xl glass   border border-border/60  ">

          <div className="flex justify-between items-center">
            <label className="text-s font-semibold text-muted-foreground tracking-wide flex items-center gap-2">
              <LeetCodeIcon className="w-4 h-4 text-leetcode" />
              LeetCode Username
            </label>


          </div>

          <Input
            type="text"
            value={data.leetcode_id ?? ""}
            onChange={(e) =>
              setData({ ...data, leetcode_id: e.target.value.toLowerCase() })
            }
            placeholder="ayush_dev"
            required
            className="
            h-11 rounded-xl
            bg-background/70
            border border-border
            px-4 text-sm w-full

            focus:border-primary
            focus:ring-2 focus:ring-primary/20

            hover:border-primary/30

            transition-all duration-200
          "
          />

          <p className="text-[11px] text-muted-foreground">
            Used to track your problem-solving progress automatically.
          </p>
        </div>

        {/* GFG */}
        <div className="space-y-3 p-4 rounded-2xl glass  border border-border/60 ">

          <div className="flex justify-between items-center">
            <label className="text-s font-semibold text-muted-foreground tracking-wide flex items-center gap-2">
              <GeeksforGeeksIcon className="w-4 h-4 text-gfg" />
              GFG Username
            </label>


          </div>

          <Input
            type="text"
            value={data.gfg_id ?? ""}
            onChange={(e) =>
              setData({ ...data, gfg_id: e.target.value.toLowerCase() })
            }
            placeholder="dhruv608"
            required
            className="
            h-11 rounded-xl
            bg-background/70
            border border-border
            px-4 text-sm w-full

            focus:border-primary
            focus:ring-2 focus:ring-primary/20

            hover:border-primary/30

            transition-all duration-200
          "
          />

          <p className="text-[11px] text-muted-foreground">
            Helps evaluate your coding performance across topics.
          </p>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3 pt-2">

          <Button
            type="button"
            onClick={() => setStep(1)}
            variant="outline"
            className="
            flex-1 h-11
            rounded-xl
            font-medium text-sm

            border-border
            hover:bg-accent/50

            transition-all duration-200
            active:scale-[0.97]
          "
          >
            ← Back
          </Button>

          <Button
            type="submit"
            disabled={!data.leetcode_id || !data.gfg_id}
            className="
            flex-1 h-11
            rounded-xl
            font-medium text-sm

            bg-primary text-primary-foreground

            hover:shadow-[0_0_20px_var(--hover-glow)]
            hover:brightness-105

            transition-all duration-200
            active:scale-[0.97]

            disabled:opacity-50 disabled:cursor-not-allowed
          "
          >
            Continue →
          </Button>
        </div>
      </form>
    </div>
  );
}
