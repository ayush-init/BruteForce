"use client";

import React from 'react';
import { Search, Plus, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/Select';
import { InfiniteScrollDropdown } from '@/components/ui/InfiniteScrollDropdown';
import { useSearchParams, useRouter } from 'next/navigation';

interface QuestionsFilterProps {
  qSearch: string;
  setQSearch: (value: string) => void;
  qLevel: string;
  setQLevel: (value: string) => void;
  qPlatform: string;
  setQPlatform: (value: string) => void;
  setIsCreateOpen: (open: boolean) => void;
  setIsBulkUploadOpen: (open: boolean) => void;
  setPage: (page: number) => void;
}

export default function QuestionsFilter({
  qSearch,
  setQSearch,
  qLevel,
  setQLevel,
  qPlatform,
  setQPlatform,
  setIsCreateOpen,
  setIsBulkUploadOpen,
  setPage,
}: QuestionsFilterProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const hasActiveFilters = () => {
    const topic = searchParams.get('topic');
    return (
      qSearch ||
      qLevel ||
      qPlatform ||
      (topic && topic !== 'all')
    );
  };

  const clearAllFilters = () => {
    setQSearch('');
    setQLevel('');
    setQPlatform('');
    setPage(1);
    const params = new URLSearchParams();
    params.set('page', '1');
    router.replace(`/admin/questions?${params.toString()}`);
  };

  return (
    <div className="glass relative z-50 rounded-2xl p-4 mb-5 flex flex-col gap-4">

      {/* TOP ROW */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">

        {/* SEARCH */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground w-4 h-4" />
          <Input
            placeholder="Search by name or paste question link..."
            value={qSearch}
            onChange={(e) => {
              setQSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9! w-full h-11 rounded-2xl placeholder:text-foreground"
          />
        </div>

        {/* BUTTONS */}
        <div className="flex w-full sm:w-auto gap-3">
          <Button
            onClick={() => setIsBulkUploadOpen(true)}
            variant="outline"
            className="flex-1 sm:flex-none h-11 rounded-2xl px-4 border-border hover:bg-muted/40"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="flex-1 sm:flex-none h-11 rounded-xl px-5 bg-primary text-black font-semibold hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">

        {/* FILTERS */}
        <div className="flex flex-wrap gap-3 w-full">

          <Select
            value={qLevel}
            onChange={(v) => { setQLevel(v as string); setPage(1); }}
            options={[
              { label: 'All Difficulties', value: '' },
              { label: 'Easy', value: 'EASY' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'Hard', value: 'HARD' },
            ]}
            className="w-full sm:w-auto min-w-[140px]"
          />

          <Select
            value={qPlatform}
            onChange={(v) => { setQPlatform(v as string); setPage(1); }}
            options={[
              { label: 'All Platforms', value: '' },
              { label: 'LeetCode', value: 'LEETCODE' },
              { label: 'GFG', value: 'GFG' },
              { label: 'Other', value: 'OTHER' },
            ]}
            className="w-full sm:w-auto min-w-[140px]"
          />

          <InfiniteScrollDropdown
            value={searchParams.get('topic') || ''}
            onValueChange={(value) => {
              const params = new URLSearchParams(searchParams.toString());
              if (value && value !== '') params.set('topic', value);
              else params.delete('topic');
              params.set('page', '1');
              router.replace(`/admin/questions?${params.toString()}`);
            }}
            placeholder="Topics"
            searchPlaceholder="Search topics..."
            className="w-full sm:w-[200px]"
          />
        </div>

        {/* CLEAR BUTTON */}
        {hasActiveFilters() && (
          <Button
            variant="ghost"
            onClick={clearAllFilters}
            className="w-full sm:w-auto h-10 px-4 text-sm border border-border"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}

      </div>
    </div>
  );
}
