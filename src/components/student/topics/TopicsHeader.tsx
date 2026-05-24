"use client";

import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TopicsHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
}

export function TopicsHeader({ searchQuery, setSearchQuery, sortBy, setSortBy }: TopicsHeaderProps) {
  return (
    <div className="mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* 🔥 HEADER */}
      <div className="mb-4 px-5 py-3 glass   rounded-2xl backdrop-blur-sm ">
        <h1 className="text-3xl sm:text-3xl font-bold text-foreground mb-2">
          Learning <span className="text-primary">Modules</span>
        </h1>

        <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
          Track your progress across different data structure and algorithm topics.
          
        </p>
      </div>

      {/* 🔥 FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-background/40 glass backdrop-blur-xl">
        {/* Left → SEARCH */}
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground w-4 h-4" />

          <Input
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9! pr-3! h-9! rounded-2xl w-full   border-border/40! focus:ring-2 focus:ring-primary/30 placeholder:text-foreground"
          />
        </div>

        {/* Right → LABEL */}
        <div className="flex items-center gap-3">


          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 rounded-2xl glass  bg-background/50 border border-border/40 px-3 min-w-[140px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="strongest">Most Solved</SelectItem>
              <SelectItem value="weakest">Less Solved</SelectItem>
            </SelectContent>
          </Select>
        </div>


      </div>

    </div>
  );
}
