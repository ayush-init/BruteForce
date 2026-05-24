"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  X,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import axios from 'axios';
import { apiClient } from '@/api';
import { useRecentQuestions } from "@/contexts/RecentQuestionsContext";
import { PaginationState, ApiError } from '@/types/student/index.types';

interface RecentQuestion {
  question_id: number;
  question_name: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topic_slug: string;
  class_slug: string;
  assigned_at: string;
}

export function RecentQuestionsSidebar() {
  const router = useRouter();
  const { isOpen, setIsOpen, selectedDate, setSelectedDate } = useRecentQuestions();
  const [questions, setQuestions] = useState<RecentQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get date strings for today, yesterday, and ereyesterday
  const getDateStrings = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const ereyesterday = new Date(today);
    ereyesterday.setDate(ereyesterday.getDate() - 2);

    const formatDate = (date: Date) => {
      return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');
    };

    return {
      today: formatDate(today),
      yesterday: formatDate(yesterday),
      ereyesterday: formatDate(ereyesterday),
      todayLabel: today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      yesterdayLabel: yesterday.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      ereyesterdayLabel: ereyesterday.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    };
  };

  const dateStrings = getDateStrings();

  // Fetch initial questions (page 1)
  const fetchRecentQuestions = async (date?: string, reset = true) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const queryDate = date || selectedDate;
      // On reset we fetch page 1. Otherwise the page state holds the last
      // page we successfully loaded, so the next page is page + 1.
      const currentPage = reset ? 1 : page + 1;
      const response = await apiClient.get(
        `/api/students/recent-questions?date=${queryDate}&page=${currentPage}&limit=12`,
        { signal }
      );

      const { questions: newQuestions, pagination: pag } = response.data;
      setPagination(pag);

      if (reset) {
        setQuestions(newQuestions);
      } else {
        setQuestions(prev => [...prev, ...newQuestions]);
      }

      setHasMore(pag?.hasNext || false);
      // Keep `page` in sync with what was actually fetched so the next
      // loadMore picks up from the right spot.
      setPage(currentPage);
    } catch (err: unknown) {
      if (axios.isCancel(err)) return;
      const error = err as ApiError;
      const errorMsg = error.response?.data?.error || "Failed to fetch recent questions";
      setError(errorMsg);
      setLoading(false);
      setLoadingMore(false);
      return;
    }
    setLoading(false);
    setLoadingMore(false);
  };

  // Load more on scroll
  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchRecentQuestions(selectedDate, false);
    }
  };

  // Handle scroll event
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Load more when user scrolls to bottom (with 100px threshold)
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMore();
    }
  };

  // Fetch only when sidebar opens or date changes
  useEffect(() => {
    if (isOpen) {
      setPage(1);
      fetchRecentQuestions(selectedDate, true);
    }
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [isOpen, selectedDate]);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  // Time formatting
  const formatTimeAgo = (assigned_at: string) => {
    const now = new Date();
    const assigned = new Date(assigned_at);
    const diffMs = now.getTime() - assigned.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 60) {
      return diffMinutes < 5 ? "NEW" : `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return "1w+ ago";
    }
  };

  const handleViewClass = (question: RecentQuestion) => {
    setIsOpen(false);
    router.push(
      `/topics/${question.topic_slug}/classes/${question.class_slug}`
    );
  };

  const getDifficultyClassName = (difficulty: string) => {
    const base =
      "border-transparent px-4 py-2 rounded-2xl text-center text-xs font-bold uppercase tracking-wider";

    switch (difficulty.toLowerCase()) {
      case "easy":
        return `${base} bg-easy/20 text-easy hover:bg-easy/20`;
      case "medium":
        return `${base} bg-medium/20 text-medium hover:bg-medium/20`;
      case "hard":
        return `${base} bg-hard/20 text-hard hover:bg-hard/20`;
      default:
        return base;
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar */}
          <div className="absolute right-0 top-0 h-full w-[85%] sm:w-[380px] md:w-[420px] max-w-[450px] border border-border shadow-2xl animate-in slide-in-from-right duration-300 overscroll-contain">

            <Card className="h-full rounded-none border-none shadow-none bg-transparent">

              {/* Header */}
              <CardHeader className="backdrop-blur-sm border-b border-border/40  ">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    Recent
                    <span className="text-primary">

                      Questions
                    </span>
                  </CardTitle>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Date Filter Buttons */}
                <div className="flex flex-col gap-1 mt-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={selectedDate === dateStrings.today ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDate(dateStrings.today)}
                      className="flex flex-col items-center gap-0.5 h-auto py-0.5 px-2 text-xs font-medium border! border-border/40! dark:border-gray-300"
                    >
                      <div className="flex items-center justify-center w-full gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className="font-semibold">Today</span>
                      </div>
                      <span className="text-xs opacity-70 leading-tight">{dateStrings.todayLabel}</span>
                    </Button>
                    <Button
                      variant={selectedDate === dateStrings.yesterday ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDate(dateStrings.yesterday)}
                      className="flex flex-col items-center gap-0.5 h-auto py-0.5 px-2 text-xs font-medium border! border-border/40! dark:border-gray-600"
                    >
                      <div className="flex items-center justify-center w-full gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className="font-semibold">Yesterday</span>
                      </div>
                      <span className="text-xs opacity-70 leading-tight">{dateStrings.yesterdayLabel}</span>
                    </Button>
                    <Button
                      variant={selectedDate === dateStrings.ereyesterday ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDate(dateStrings.ereyesterday)}
                      className="flex flex-col items-center gap-0.5 h-auto py-0.5 px-2 text-xs font-medium  border! border-border/40!  dark:border-gray-600"
                    >
                      <div className="flex items-center justify-center w-full gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className="font-semibold">Ereyesterday</span>
                      </div>
                      <span className="text-xs opacity-70 leading-tight">{dateStrings.ereyesterdayLabel}</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Content */}
              <CardContent className="p-0">
                <div
                  ref={scrollRef}
                  className="h-[calc(100vh-140px)] px-4 py-4 overflow-y-auto"
                  onScroll={handleScroll}
                >

                  {loading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Card
                          key={i}
                          className=" glass rounded-2xl animate-in fade-in slide-in-from-right-2"
                          style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center gap-4">
                              {/* Left */}
                              <div className="flex-1 min-w-0">
                                <div className="h-4 w-full bg-muted/50 rounded mb-2 animate-pulse" />
                                <div className="h-4 w-3/4 bg-muted/40 rounded animate-pulse" />

                                <div className="flex items-center gap-2 mt-3">
                                  <div className="h-5 w-12 bg-muted/40 rounded-full animate-pulse" />
                                  <div className="h-3 w-16 bg-muted/30 rounded animate-pulse" />
                                </div>
                              </div>

                              {/* Right */}
                              <div className="h-8 w-16 bg-muted/50 rounded-lg animate-pulse" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : error ? (
                    <div className="p-6 text-center">
                      <p className="text-sm text-destructive">{error}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchRecentQuestions()}
                        className="mt-3"
                      >
                        Retry
                      </Button>
                    </div>
                  ) : questions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                      <DotLottieReact
                        src="/Empty.json"
                        loop
                        autoplay
                        className="w-48 h-48"
                      />
                      <p className="text-sm mt-2">No recent questions</p>
                    </div>
                  ) : (
                    <div className="space-y-4">

                      {questions.map((question, index) => (
                        <Card
                          key={question.question_id}
                          className=" glass rounded-2xl hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer "
                          style={{
                            animationDelay: `${index * 60}ms`,
                            animation: "slideIn 0.35s ease forwards",
                          }}
                        >
                          <CardContent className="p-4">

                            <div className="flex justify-between items-center gap-4">

                              {/* Left */}
                              <div className="flex-1 min-w-0">

                                <h4 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                  {question.question_name}
                                </h4>

                                <div className="flex items-center gap-2">

                                  <Badge
                                    variant="outline"
                                    className={getDifficultyClassName(question.difficulty)}
                                  >
                                    {question.difficulty}
                                  </Badge>



                                </div>
                              </div>

                              {/* Right */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleViewClass(question)
                                }
                                className="shrink-0 border border-white/10 bg-white/5 backdrop-blur-md hover:text-primary transition-all"
                              >
                                View
                                <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>

                            </div>

                          </CardContent>
                        </Card>
                      ))}

                    </div>
                  )}

                  {/* Load more indicator — skeleton matches initial-load cards */}
                  {loadingMore && (
                    <div className="space-y-4 mt-4">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <Card
                          key={`more-${i}`}
                          className="glass rounded-2xl animate-in fade-in slide-in-from-bottom-2"
                          style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="h-4 w-full bg-muted/50 rounded mb-2 animate-pulse" />
                                <div className="h-4 w-3/4 bg-muted/40 rounded animate-pulse" />
                                <div className="flex items-center gap-2 mt-3">
                                  <div className="h-5 w-12 bg-muted/40 rounded-full animate-pulse" />
                                  <div className="h-3 w-16 bg-muted/30 rounded animate-pulse" />
                                </div>
                              </div>
                              <div className="h-8 w-16 bg-muted/50 rounded-lg animate-pulse" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* End of list message */}
                  {!hasMore && questions.length > 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No more questions
                    </div>
                  )}

                </div>
              </CardContent>

            </Card>
          </div>
        </div>
      )}

      {/* Animation */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
