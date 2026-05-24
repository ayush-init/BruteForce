"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, ChevronDown, X, Check } from "lucide-react";
import { topicsService, TopicsResponse } from "@/services/topics.service";
import type { Topic } from '@/types/admin/index.types';

/* Debounce */
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/* Shimmer */
const Shimmer = () => (
  <div className="p-3 space-y-2">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="h-4 bg-muted/60 rounded animate-pulse"></div>
        <div className="h-3 bg-muted/40 rounded w-3/4 animate-pulse"></div>
      </div>
    ))}
  </div>
);

interface Props {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  returnId?: boolean;
}

export function InfiniteScrollDropdown({
  value = "",
  onValueChange,
  placeholder = "Select Topic",
  searchPlaceholder = "Search topics...",
  disabled = false,
  className = "",
  returnId = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* Reset */
  const resetTopics = useCallback(() => {
    setTopics([]);
    setCurrentPage(1);
    setHasMore(true);
  }, []);

  /* Fetch */
  const fetchTopics = useCallback(
    async (page: number, search: string, isReset = false) => {
      if (loadingTopics || (!hasMore && !isReset)) return;

      setLoadingTopics(true);
      try {
        const res: TopicsResponse =
          await topicsService.getPaginatedTopics({
            page,
            limit: 6,
            search,
          });

        setTopics((prev) => {
          const newTopics = isReset ? res.topics : [...prev, ...res.topics];
          // Deduplicate by topic.id
          const uniqueTopics = Array.from(
            new Map(newTopics.map(topic => [topic.id, topic])).values()
          );
          return uniqueTopics;
        });

        setHasMore(res.pagination.hasNextPage);
        setCurrentPage(page);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTopics(false);
      }
    },
    [loadingTopics, hasMore]
  );

  /* Debounced Search */
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      resetTopics();
      fetchTopics(1, query, true);
    }, 300),
    [fetchTopics, resetTopics]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    debouncedSearch(q);
  };

  const handleSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    onValueChange(returnId ? topic.id.toString() : topic.slug);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    setSelectedTopic(null);
    onValueChange("");
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  /* Sync internal selection with the controlled `value` prop.
     The internal `selectedTopic` drives both the trigger label and the X
     button. Without this sync, an external reset (e.g. a parent "Clear
     filters" button setting value="") leaves the dropdown visually stuck
     on the previously-picked topic. We only react to the empty case so we
     don't fight `handleSelect` when the user is actively choosing one. */
  useEffect(() => {
    if (!value) {
      setSelectedTopic(null);
    }
  }, [value]);

  /* Initial Load */
  useEffect(() => {
    if (isOpen && topics.length === 0) {
      fetchTopics(1, "", true);
    }
  }, [isOpen]);

  /* Outside Click */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* Infinite Scroll (FIXED) */
  useEffect(() => {
    const el = listRef.current;
    if (!el || !isOpen) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;

      if (scrollTop + clientHeight >= scrollHeight * 0.8) {
        fetchTopics(currentPage + 1, searchQuery);
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [isOpen, currentPage, searchQuery, fetchTopics]);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>

      {/* Trigger */}
      <div
        onClick={toggleDropdown}
        className="flex items-center justify-between h-10 px-4 rounded-full 
        bg-accent/40 border border-border text-sm cursor-pointer"
      >
        <span className="truncate">
          {selectedTopic?.topic_name || placeholder}
        </span>

        <div className="flex items-center gap-2">
          {selectedTopic && (
            <X
              className="w-3 h-3"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            />
          )}
          <ChevronDown
            className={`w-4 h-4 transition ${isOpen ? "rotate-180" : ""
              }`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="
  absolute top-full mt-1 left-0 right-0 z-100 
  rounded-2xl border border-border p-2 shadow-lg 
  max-h-72 flex flex-col bg-background/95 glass backdrop-blur-md overflow-y-auto no-scrollbar
"
        >
          {/* Search */}
          <div className="p-2 border-b border-border/60">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-sm bg-accent/40 
                border border-border rounded-lg outline-none"
              />
            </div>
          </div>

          {/* LIST (ONLY SCROLL HERE ✅) */}
          <div
            ref={listRef}
            className="max-h-60 overflow-y-auto p-1 scroll-smooth no-scrollbar"
          >
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleSelect(topic)}
                className="w-full text-left px-3 py-2 rounded-lg 
                text-sm hover:bg-accent/60 transition"
              >
                {topic.topic_name}
              </button>
            ))}

            {loadingTopics && <Shimmer />}

            {!hasMore && topics.length > 0 && (
              <div className="text-center text-xs text-muted-foreground py-2">
                No more topics
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}