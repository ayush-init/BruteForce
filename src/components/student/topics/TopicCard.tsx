"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Lock } from "lucide-react";

interface TopicCardProps {
  topicSlug: string;
  topicName: string;
  photoUrl?: string;
  totalQuestions: number;
  solvedQuestions: number;
  totalClasses: number;
  progressPercentage?: number;
}

export function TopicCard({
  topicSlug,
  topicName,
  photoUrl,
  totalQuestions,
  solvedQuestions,
  totalClasses,
  progressPercentage,
}: TopicCardProps) {
  const progress =
    progressPercentage !== undefined
      ? progressPercentage
      : totalQuestions === 0
        ? 0
        : (solvedQuestions / totalQuestions) * 100;

  const isLocked = totalClasses === 0;

  const CardContent = () => (
    <div
      className={`relative overflow-hidden rounded-2xl glass backdrop-blur-2xl transition-all duration-300 
      min-h-[260px] flex flex-col
      ${isLocked ? "cursor-not-allowed" : "hover:shadow-primary/10 group"}`}
    >
      {/* 🔒 LOCK OVERLAY */}
      {isLocked && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-2xl">
          <div className="flex flex-col items-center gap-2">
            <Lock className="w-10 h-10 text-primary" />
            <span className="text-sm font-semibold text-muted-foreground">Topic Locked</span>
          </div>
        </div>
      )}

      {/* 🖼 IMAGE */}
      <div className="relative h-[150px] overflow-hidden border-b border-border/50">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={topicName}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            quality={75}
            className={`object-cover transition-transform duration-500 ${isLocked ? "scale-100" : "group-hover:scale-105"
              }`}
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
      </div>

      {/* 📦 CONTENT */}
      <div className="p-4 flex flex-col justify-between flex-1 gap-3">
        {/* TITLE */}
        <h3
          className={`text-base font-semibold line-clamp-1 transition-colors ${isLocked
            ? "text-muted-foreground"
            : "text-foreground group-hover:text-logo"
            }`}
        >
          {topicName}
        </h3>

        {/* STATS */}
        {isLocked ? (
          <div />
        ) : (
          <div className="flex items-center justify-between text-[12px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{totalClasses} classes</span>
            </div>

            <div className="px-2 py-0.5 rounded-2xl bg-muted/40 border border-border/50">
              {totalQuestions === 0 ? "No questions" : `${solvedQuestions}/${totalQuestions} Questions`}
            </div>
          </div>
        )}

        {/* 📊 PROGRESS (same height always) */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${isLocked
              ? "bg-muted-foreground/30"
              : "bg-primary shadow-[0_0_6px_rgba(34,197,94,0.4)]"
              }`}
            style={{ width: `${isLocked ? 0 : progress}%` }}
          />
        </div>
      </div>
    </div>
  );

  return isLocked ? (
    <div className="block rounded-2xl">
      <CardContent />
    </div>
  ) : (
    <Link href={`/topics/${topicSlug}`} className="block rounded-2xl">
      <CardContent />
    </Link>
  );
}
