"use client";

import React from "react";
import { PodiumCard } from "./PodiumCard";
import { PodiumShimmer } from "./PodiumShimmer";
import { LeaderboardEntry } from "@/types/admin/leaderboard.types";

interface PodiumSectionProps {
  top3: LeaderboardEntry[];
  loading: boolean;
  selectedCity: string;
}

export default function PodiumSection({ top3, loading, selectedCity }: PodiumSectionProps) {
  if (loading) {
    return <PodiumShimmer />;
  }
  
  if (!top3 || top3.length === 0) return null;

  // Determine rank field based on city selection (same logic as LeaderboardTableRow)
  const isGlobalView = selectedCity === 'all';
  
  return (
    <div className=" relative flex justify-center items-center gap-6 md:gap-12 pt-6 pb-8">

      

      {/* 🏆 Podium Layout */}
      <div className="flex items-center gap-6 md:gap-12">

        {/* Rank 2 */}
        <PodiumCard 
          student={top3?.[1]} 
          rank={isGlobalView ? (top3?.[1]?.global_rank || 2) : (top3?.[1]?.city_rank || 2)} 
        />

        {/* Rank 1 (Center Hero) */}
        <PodiumCard 
          student={top3?.[0]} 
          rank={isGlobalView ? (top3?.[0]?.global_rank || 1) : (top3?.[0]?.city_rank || 1)} 
          isCenter 
        />

        {/* Rank 3 */}
        <PodiumCard 
          student={top3?.[2]} 
          rank={isGlobalView ? (top3?.[2]?.global_rank || 3) : (top3?.[2]?.city_rank || 3)} 
        />

      </div>
    </div>
  );
}
