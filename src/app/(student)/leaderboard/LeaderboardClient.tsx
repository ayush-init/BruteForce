"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { studentLeaderboardService } from "@/services/student/leaderboard.service";
import { studentAuthService } from "@/services/student/auth.service";
import { LeaderboardTable } from "@/components/student/leaderboard/LeaderboardTable";
import { YourRank } from "@/components/student/leaderboard/YourRank";
import { isStudentToken, clearAuthTokens } from "@/lib/auth-utils";
import PodiumSection from "@/components/student/leaderboard/PodiumSection";
import MobilePodiumSection from "@/components/student/leaderboard/MobilePodiumSection";
import { LeaderboardHeader } from "@/components/student/leaderboard/LeaderboardHeader";
import { LeaderboardCity, LeaderboardData } from '@/types/student/index.types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

import { SyncTime } from '@/lib/utils/cronUtils';

export default function LeaderboardClient({ syncSchedule = [] }: { syncSchedule?: SyncTime[] }) {
  const [lCity, setLCity] = useState<LeaderboardCity['city_name']>('All Cities');
  const [lYear, setLYear] = useState<number | null>(null);
  const [lSearch, setLSearch] = useState('');
  const debouncedSearch = useDebouncedValue(lSearch, 500);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [podiumDirty, setPodiumDirty] = useState(false);
  const [podiumKey, setPodiumKey] = useState(0);
  const [podiumData, setPodiumData] = useState<any[] | null>(null);
  const [lastCalculated, setLastCalculated] = useState<string | undefined>(undefined);

  // Reset podium when city or year changes so it re-locks from new filter's top 3
  useEffect(() => { setPodiumData(null); }, [lCity, lYear]);

  const handleResetPodium = useCallback(() => {
    setPodiumDirty(false);
    setPodiumKey(k => k + 1);
  }, []);

  // Get current student data to set default city and year
  const { data: studentData } = useQuery({
    queryKey: ['currentStudent'],
    queryFn: async () => {
      const response = await studentAuthService.getCurrentStudent();
      return response;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: false
  });

  // Extract available years from API response
  const { data: leaderboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['studentLeaderboard', lCity === 'all' ? 'all' : lCity, lYear, debouncedSearch],
    queryFn: async () => {
      // Check if we have a student token before making the request
      if (!isStudentToken()) {
        clearAuthTokens(); // Clear invalid tokens
        const error = new Error('Access denied. Students only.');
        (error as { response?: { status: number; data?: { error: string } } }).response = { status: 403, data: { error: 'Access denied. Students only.' } };
        throw error;
      }

      // Don't make request if we don't have a valid year yet
      if (!lYear) {
        return null;
      }

      const filters = {
        city: lCity === 'All Cities' ? 'all' : lCity,
        year: lYear,
      };

      return await studentLeaderboardService.getLeaderboard(filters, debouncedSearch);
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!lYear, // Only run query when we have a valid year

    // 🔥 ADD THESE
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData,
  });

  // Compute year options similar to admin leaderboard
  const yearOptions = useMemo(() => {
    if (!leaderboardData?.available_cities) return [];
    if (lCity === 'all' || lCity === 'All Cities') {
      const allCitiesEntry = leaderboardData.available_cities.find(
        (city: LeaderboardCity) => city.city_name === "All Cities"
      );
      return allCitiesEntry?.available_years || [];
    }
    const cityData = leaderboardData.available_cities.find(
      (city: LeaderboardCity) => city.city_name === lCity
    );
    return cityData?.available_years || [];
  }, [leaderboardData?.available_cities, lCity]);

  // Set default city and year based on logged-in student
  useEffect(() => {
    if (studentData) {
      const student = studentData;
      const batchYear = student.batch?.year;
      setLCity(student.city?.city_name || 'all');
      setLYear(batchYear || null); // Use null instead of hardcoded fallback
      setIsInitialLoading(false); // Stop initial loading once year is set
    }
  }, [studentData]);

  // Reset year when city changes (similar to admin)
  useEffect(() => {
    if (yearOptions.length > 0 && !yearOptions.includes(lYear)) {
      setLYear(yearOptions[0]);
    }
  }, [lCity, yearOptions, lYear]);

  // Lock podium from first successful no-search result per city+year
  useEffect(() => {
    if (!debouncedSearch && leaderboardData?.top10?.length) {
      setPodiumData(prev => prev ?? leaderboardData.top10.slice(0, 3));
    }
  }, [leaderboardData?.top10, debouncedSearch]);

  // Persist last_calculated — never goes back to undefined on re-fetch
  useEffect(() => {
    if (leaderboardData?.last_calculated) setLastCalculated(leaderboardData.last_calculated);
  }, [leaderboardData?.last_calculated]);

  const data = leaderboardData;
  const combinedLoading = isLoading || isInitialLoading;
  const currentUsername = data?.yourRank?.username || studentData?.username;

  return (
    <>

      <YourRank yourRank={data?.yourRank} />
        <div className=" mx-auto max-w-7xl w-full pb-4 px-4 sm:px-6 lg:px-8 xl:px-12 pt-4">
        <LeaderboardHeader
          lCity={lCity}
          lYear={lYear}
          lastUpdated={lastCalculated}
          syncSchedule={syncSchedule}
          onResetPodium={podiumDirty ? handleResetPodium : undefined}
          lSearch={lSearch}
          setLSearch={setLSearch}
          setLCity={setLCity}
          setLYear={setLYear}
          cityOptionsObj={[
            ...(isLoading ? [
              { value: 'loading', label: 'Loading...' }
            ] : []),
            ...(data?.available_cities?.map((city: LeaderboardCity) => ({
              value: city.city_name,
              label: city.city_name
            })) || [])
          ]}
          yearOptionsObj={[
            ...(isLoading ? [] : yearOptions.map((y: number) => ({
              value: y.toString(),
              label: y.toString()
            })))
          ]}
          allYears={isLoading ? [] : yearOptions}
          isLoading={combinedLoading}
        />
        {/* Mobile Podium - fixed, never re-shimmers on search/filter changes */}
        <div className="md:hidden">
          <MobilePodiumSection
            key={podiumKey}
            top3={podiumData || []}
            loading={!podiumData}
            error={error?.message}
            selectedCity={lCity === 'All Cities' ? 'all' : lCity}
            currentUsername={currentUsername}
          />
        </div>

        {/* Desktop Podium - fixed, never re-shimmers on search/filter changes */}
        <div className="hidden md:block">
          <PodiumSection
            key={podiumKey}
            top3={podiumData || []}
            loading={!podiumData}
            error={error?.message}
            selectedCity={lCity === 'All Cities' ? 'all' : lCity}
            onCardDragged={() => setPodiumDirty(true)}
            currentUsername={currentUsername}
          />
        </div>
        <div className="flex flex-col space-y-6">

          <LeaderboardTable
            data={{
              leaderboard: debouncedSearch
                ? (data?.top10 || [])
                : (data?.top10?.slice(3) || []),
              total: debouncedSearch
                ? (data?.top10?.length || 0)
                : Math.max(0, (data?.top10?.length || 0) - 3)
            }}
            loading={combinedLoading}
            error={error?.message}
            selectedCity={lCity === 'All Cities' ? 'all' : lCity}
            page={1}
            limit={10}
            setPage={() => { }}
            setLimit={() => { }}
            mode="student"
            currentUsername={currentUsername}
          />
        </div>
      </div>
    </>
  );
}