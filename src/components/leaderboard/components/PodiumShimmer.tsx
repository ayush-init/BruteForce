"use client";

import React from "react";
import { Trophy, Award } from "lucide-react";

export function PodiumShimmer() {
  return (
    <div className="relative flex justify-center items-center gap-6 md:gap-12 pt-6 pb-8">

      

      {/* 🏆 Podium Layout Shimmer */}
      <div className="flex items-center gap-6 md:gap-12">
        
        {/* Rank 2 Shimmer */}
        <div className="relative group scale-95 opacity-80">
          <div className="glass rounded-3xl px-8 py-10 w-[230px] md:w-[260px] text-center border border-border/50 shadow-xl backdrop-blur-xl">
            
            {/* Crown Shimmer */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-10 bg-muted/50 rounded-full animate-pulse" />
            
            {/* Avatar Shimmer */}
            <div className="relative mb-5 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-md opacity-70 bg-muted/30 animate-pulse" />
                <div className="relative w-44 h-44 rounded-full border-2 border-border/50 bg-muted/30 animate-pulse" />
                <div className="absolute bottom-2 right-0 w-12 h-8 bg-muted/50 rounded-2xl animate-pulse" />
              </div>
            </div>

            {/* Name Shimmer */}
            <div className="h-8 w-32 bg-muted/50 rounded-lg mx-auto mb-2 animate-pulse" />
            
            {/* Username Shimmer */}
            <div className="h-4 w-24 bg-muted/40 rounded mx-auto mb-1 animate-pulse" />
            
            {/* Location Shimmer */}
            <div className="h-3 w-20 bg-muted/30 rounded mx-auto mb-5 animate-pulse" />
            
            {/* Score Shimmer */}
            <div className="rounded-2xl border border-border py-4 bg-muted/20">
              <div className="h-3 w-12 bg-muted/40 rounded mx-auto mb-2 animate-pulse" />
              <div className="h-8 w-16 bg-muted/50 rounded mx-auto animate-pulse" />
            </div>
          </div>
        </div>

        {/* Rank 1 (Center Hero) Shimmer */}
        <div className="relative group scale-110 z-20">
          <div className="glass rounded-3xl px-8 py-10 w-[230px] md:w-[260px] text-center border border-border/50 shadow-xl backdrop-blur-xl">
            
            {/* Crown Shimmer */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-10 bg-muted/50 rounded-full animate-pulse" />
            
            {/* Avatar Shimmer */}
            <div className="relative mb-5 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-md opacity-70 bg-muted/30 animate-pulse" />
                <div className="relative w-44 h-44 rounded-full border-2 border-border/50 bg-muted/30 animate-pulse" />
                <div className="absolute bottom-2 right-0 w-12 h-8 bg-muted/50 rounded-2xl animate-pulse" />
              </div>
            </div>

            {/* Name Shimmer */}
            <div className="h-8 w-32 bg-muted/50 rounded-lg mx-auto mb-2 animate-pulse" />
            
            {/* Username Shimmer */}
            <div className="h-4 w-24 bg-muted/40 rounded mx-auto mb-1 animate-pulse" />
            
            {/* Location Shimmer */}
            <div className="h-3 w-20 bg-muted/30 rounded mx-auto mb-5 animate-pulse" />
            
            {/* Score Shimmer */}
            <div className="rounded-2xl border border-border py-4 bg-muted/20">
              <div className="h-3 w-12 bg-muted/40 rounded mx-auto mb-2 animate-pulse" />
              <div className="h-8 w-16 bg-muted/50 rounded mx-auto animate-pulse" />
            </div>
          </div>
        </div>

        {/* Rank 3 Shimmer */}
        <div className="relative group scale-95 opacity-80">
          <div className="glass rounded-3xl px-8 py-10 w-[230px] md:w-[260px] text-center border border-border/50 shadow-xl backdrop-blur-xl">
            
            {/* Crown Shimmer */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-10 bg-muted/50 rounded-full animate-pulse" />
            
            {/* Avatar Shimmer */}
            <div className="relative mb-5 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-md opacity-70 bg-muted/30 animate-pulse" />
                <div className="relative w-44 h-44 rounded-full border-2 border-border/50 bg-muted/30 animate-pulse" />
                <div className="absolute bottom-2 right-0 w-12 h-8 bg-muted/50 rounded-2xl animate-pulse" />
              </div>
            </div>

            {/* Name Shimmer */}
            <div className="h-8 w-32 bg-muted/50 rounded-lg mx-auto mb-2 animate-pulse" />
            
            {/* Username Shimmer */}
            <div className="h-4 w-24 bg-muted/40 rounded mx-auto mb-1 animate-pulse" />
            
            {/* Location Shimmer */}
            <div className="h-3 w-20 bg-muted/30 rounded mx-auto mb-5 animate-pulse" />
            
            {/* Score Shimmer */}
            <div className="rounded-2xl border border-border py-4 bg-muted/20">
              <div className="h-3 w-12 bg-muted/40 rounded mx-auto mb-2 animate-pulse" />
              <div className="h-8 w-16 bg-muted/50 rounded mx-auto animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
