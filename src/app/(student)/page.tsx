"use client";



import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { studentTopicService } from '@/services/student/topic.service';
import { studentAuthService } from '@/services/student/auth.service';
import { useProfile } from '@/contexts/ProfileContext';
import { isStudentToken } from '@/lib/auth-utils';
import { TopicCard } from '@/components/student/topics/TopicCard';
import { Button } from '@/components/ui/button';
import { Target, Flame, Trophy } from 'lucide-react';
import { HeroSection } from '@/components/student/home/HeroSection';
import { TopicsSection } from '@/components/student/home/TopicsSection';
import { TopicsSectionShimmer } from '@/components/student/home/TopicsSectionShimmer';
import { Topic, User, StudentDataResponse, DashboardStats } from '@/types/student/index.types';


export default function StudentHomePage() {

  const router = useRouter();

  const [topics, setTopics] = useState<Topic[]>([]);

  const { profile, profileLoading } = useProfile();

  const [studentResponse, setStudentResponse] = useState<StudentDataResponse | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    solved: 0,
    rank: '-',
    topicsActive: 0
  });

  const [loading, setLoading] = useState(true);
  const isFetching = useRef(false);
  const lastFetchParams = useRef({});



  const fetchTopicsOnly = async () => {

    // Check if we have a student token before making API calls

    if (!isStudentToken()) {
      setLoading(false);

      return;

    }

    // Skip if already fetching
    if (isFetching.current) {
      return;
    }



    try {
      isFetching.current = true;

      // Only fetch topics, profile data comes from ProfileContext

      const topicsData = await studentTopicService.getTopics({ limit: 8 }).catch((e: unknown) => {
        console.warn("Failed to fetch topics (potentially missing batch)", e);
        return { topics: [] };
      });



      setTopics(topicsData.topics || []);



      // For now, set basic stats - can be enhanced later if needed

      const activeTopics = (topicsData.topics || []).filter((t: Topic) => (t.batchSpecificData?.solvedQuestions || 0) > 0).length;



      setStats({

        solved: 0, // Will be updated if we add stats to /me endpoint

        rank: '-',

        topicsActive: activeTopics

      });

    } catch (e) {
      // Error is handled by API client interceptor
      console.error("Error refreshing user data", e);
    } finally {
      isFetching.current = false;
      setLoading(false);
    }

  };



  useEffect(() => {

    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          window.location.href = '/login';
          return;
        }
        await fetchTopicsOnly();
      } catch (e) {
        // Error is handled by API client interceptor
        console.error("Dashboard data fetch error", e);
        // Auth errors are handled by API interceptor (auto-redirect on 401)
      }
    };
    fetchDashboardData();
    // Listen to profile updates (e.g., from onboarding) to refresh dashboard stats dynamically
    window.addEventListener('profileUpdated', fetchTopicsOnly);

    return () => window.removeEventListener('profileUpdated', fetchTopicsOnly);

  }, []);



  // Get top 4 topics for the showcase

  const displayTopics = topics.slice(0, 8);



  return (

   

      <div className="flex flex-col w-full pb-12">

        {/* HERO SECTION - Always render immediately */}

        <HeroSection />



        {/* TOPICS SECTION - Always render header, show shimmer only for topic cards */}

        <TopicsSection topics={topics} loading={loading} />

      </div>

  

  );

}

