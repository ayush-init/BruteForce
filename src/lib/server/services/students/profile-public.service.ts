import prisma from '@/lib/server/config/prisma';
import { ApiError } from '@/lib/server/utils/ApiError';
import redis from '@/lib/server/config/redis';
import { CACHE_TTL } from '@/lib/server/config/cache.config';
import { buildCacheKey, setWithTTL, safeGet } from '@/lib/server/utils/redisUtils';
import { 
  buildHeatmapOptimized, 
  fetchAssignedDates, 
  fetchSubmissionCounts,
  hasCompletedAllQuestions,
  normalizeDate
} from "./profile-heatmap.service";

interface HeatmapData {
  date: string;
  count: number;
}

export const getPublicStudentProfileService = async (username: string) => {
  const startTime = Date.now();
  const timings: Record<string, number> = {};
  
  // Generate cache key for username-based profile
  const cacheKey = `student:profile:public:${username}`;
  
  // 1. Try cache first
  const cached = await safeGet(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  
  // 2 Get student basic info + leaderboard (single query with all relations)
  const t1 = Date.now();
  const student = await prisma.student.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      enrollment_id: true,
      github: true,
      linkedin: true,
      leetcode_id: true,
      gfg_id: true,
      profile_image_url: true,
      batch_id: true,
      city: { select: { id: true, city_name: true } },
      batch: { select: { id: true, batch_name: true, year: true } },
      leaderboards: true
    }
  });

  timings.studentQuery = Date.now() - t1;
  
  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  const studentId = student.id;
  const batchId = student.batch_id!;
  const leaderboard = student.leaderboards;

    // 2 Parallel execution: Batch counts, Recent activity, Assigned dates
    // Note: Skip getBatchStartMonth - we'll compute it from assigned dates
    const t2 = Date.now();
    const [
      batchQuestionCounts,
      recentActivity,
      assignedDatesForStartMonth
    ] = await Promise.all([
      prisma.batch.findUnique({
        where: { id: batchId },
        select: { easy_assigned: true, medium_assigned: true, hard_assigned: true, year: true }
      }),
      prisma.studentProgress.findMany({
        where: { student_id: studentId },
        include: {
          question: { select: { question_name: true, level: true, question_link: true } }
        },
        orderBy: { sync_at: "desc" },
        take: 5
      }),
      // Fetch ALL assigned dates to determine start month (avoids slow MIN() query)
      prisma.$queryRaw<{ date: string }[]>`
        SELECT DISTINCT DATE(qv.assigned_at) as date
        FROM "QuestionVisibility" qv
        JOIN "Class" c ON qv.class_id = c.id
        WHERE c.batch_id = ${batchId}
        AND qv.assigned_at IS NOT NULL
        ORDER BY DATE(qv.assigned_at) ASC
        LIMIT 1
      `
    ]);
    
    // Compute start month from first assigned date (avoids slow MIN() query)
    let heatmapStartMonth: Date;
    if (assignedDatesForStartMonth.length > 0 && assignedDatesForStartMonth[0].date) {
      const firstDate = new Date(assignedDatesForStartMonth[0].date);
      heatmapStartMonth = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    } else {
      heatmapStartMonth = student.batch?.year 
        ? new Date(student.batch.year, 0, 1) 
        : new Date();
    }

  timings.parallelQueries = Date.now() - t2;

  // 3 Build heatmap data (simplified approach without separate caching)
  const t3 = Date.now();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 1); // Include today
  
  const [assignedDates, submissionCounts] = await Promise.all([
    fetchAssignedDates(batchId, heatmapStartMonth),
    fetchSubmissionCounts(studentId, heatmapStartMonth)
  ]);
  
  timings.heatmapDataFetch = Date.now() - t3;
  
  // 4 Build heatmap in JavaScript
  const t4 = Date.now();
  const completedAll = hasCompletedAllQuestions(batchQuestionCounts, leaderboard);
  const heatmap = buildHeatmapOptimized({
    startDate: heatmapStartMonth,
    endDate,
    assignedDates,
    submissionCounts,
      completedAll
    });
  timings.heatmapBuild = Date.now() - t4;

  timings.total = Date.now() - startTime;
  // Profile API timings tracked for performance monitoring

  const result = {
    student: {
      id: student.id,
      name: student.name,
      username: student.username,
      enrollmentId: student.enrollment_id,
      city: student.city?.city_name || null,
      batch: student.batch?.batch_name || null,
      year: student.batch?.year || null,
      github: student.github,
      linkedin: student.linkedin,
      leetcode: student.leetcode_id,
      gfg: student.gfg_id,
      profileImageUrl: student.profile_image_url
    },
    codingStats: {
      // Derived from the same Leaderboard counters that feed easy/medium/hard
      // below, so the big "Total Solved" number can never disagree with the
      // sum of the three difficulty bars. Both update together when the
      // leaderboard sync cron runs (9 AM / 6 PM / 11 PM IST).
      totalSolved:
        (leaderboard?.easy_solved || 0) +
        (leaderboard?.medium_solved || 0) +
        (leaderboard?.hard_solved || 0),
      totalAssigned: (batchQuestionCounts?.easy_assigned || 0) + (batchQuestionCounts?.medium_assigned || 0) + (batchQuestionCounts?.hard_assigned || 0),
      easy: {
        assigned: batchQuestionCounts?.easy_assigned || 0,
        solved: leaderboard?.easy_solved || 0
      },
      medium: {
        assigned: batchQuestionCounts?.medium_assigned || 0,
        solved: leaderboard?.medium_solved || 0
      },
      hard: {
        assigned: batchQuestionCounts?.hard_assigned || 0,
        solved: leaderboard?.hard_solved || 0
      }
    },

    streak: {
      currentStreak: leaderboard?.current_streak || 0,
      maxStreak: leaderboard?.max_streak || 0
    },

    leaderboard: {
      globalRank: leaderboard?.alltime_global_rank || 0,
      cityRank: leaderboard?.alltime_city_rank || 0
    },

    heatmap: heatmap.map((h) => ({
      date: h.date,
      count: Number(h.count)
    })),

    heatmapStartMonth: normalizeDate(heatmapStartMonth),

    recentActivity: recentActivity.map((a) => ({
      question_name: a.question.question_name,
      question_link: a.question.question_link,
      difficulty: a.question.level,
      solvedAt: a.sync_at
    }))
  };

  // 3. Cache result with modern Redis SET syntax (avoid duplicate JSON.stringify)
  const serializedResult = JSON.stringify(result);
  await setWithTTL(cacheKey, serializedResult, CACHE_TTL.studentPublicProfile);
  

  return result;
};
