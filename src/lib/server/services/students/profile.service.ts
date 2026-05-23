import prisma from '@/lib/server/config/prisma';
import { ApiError } from '@/lib/server/utils/ApiError';
import { CacheInvalidation } from '@/lib/server/utils/cacheInvalidation';
import { buildCacheKey, delKeys, deleteByPattern } from '@/lib/server/utils/redisUtils';

export const updateStudentProfileData = async (
  studentId: number,
  { leetcode_id, gfg_id, github, linkedin, username }: any
) => {
  // Get current student to check if they already have city and batch
  const currentStudent = await prisma.student.findUnique({
    where: { id: studentId },
    select: { city_id: true, batch_id: true, username: true }
  });

  if (!currentStudent) {
    throw new ApiError(404, "Student not found", [], "STUDENT_NOT_FOUND");
  }

  // Build update data - only include fields that are provided.
  // Username is normalized to lowercase to match how
  // checkUsernameAvailabilityService normalizes it — otherwise a student
  // typing "Ayush" sees "available" in the check (which lowercases to
  // "ayush") but the update would store "Ayush" raw, and another student
  // submitting "ayush" later would collide unexpectedly.
  const updateData: any = {};

  if (leetcode_id !== undefined) updateData.leetcode_id = leetcode_id;
  if (gfg_id !== undefined) updateData.gfg_id = gfg_id;
  if (github !== undefined) updateData.github = github;
  if (linkedin !== undefined) updateData.linkedin = linkedin;

  const normalizedUsername =
    typeof username === 'string' && username.trim()
      ? username.trim().toLowerCase()
      : undefined;
  if (normalizedUsername) {
    updateData.username = normalizedUsername;
  }

  // Wrap in try-catch to handle the username race condition: two students
  // can both pass the check-username "available" check within the 500ms
  // debounce window, and then both submit the same username. The first
  // wins; the second hits Prisma's P2002 unique constraint. Without this
  // catch, the second student sees an opaque 500 error — with it, they
  // get a clear "this username was just taken, pick another".
  let updated;
  try {
    updated = await prisma.student.update({
      where: { id: studentId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        leetcode_id: true,
        gfg_id: true,
        github: true,
        linkedin: true,
        city_id: true,
        batch_id: true,
        created_at: true
      }
    });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      const target = e?.meta?.target as string[] | undefined;
      if (target?.includes('username')) {
        throw new ApiError(
          409,
          'This username was just taken by someone else — please pick a different one.',
          [],
          'USERNAME_TAKEN'
        );
      }
      // Some other unique field collided — surface a generic but
      // non-cryptic message instead of the raw Prisma error.
      throw new ApiError(
        409,
        `Duplicate value${target?.length ? ` for ${target.join(', ')}` : ''}`,
        [],
        'DUPLICATE_ENTRY'
      );
    }
    throw e;
  }

  // Invalidate leaderboard caches when student profile data changes
  await CacheInvalidation.invalidateAllLeaderboards();

  // Invalidate student:me cache
  const meCacheKey = buildCacheKey(`student:me:${studentId}`, {});
  await delKeys(meCacheKey);

  // Invalidate student profile cache
  await CacheInvalidation.invalidateStudentProfile(studentId);

  // Invalidate public profile cache for old username if username changed.
  // Use the normalized username for the comparison so a case-only "change"
  // doesn't trigger a spurious cache flush.
  if (normalizedUsername && normalizedUsername !== currentStudent.username) {
    await delKeys(`student:profile:public:${currentStudent.username}`);
  }

  // Invalidate heatmap cache (pattern delete — was buggy as redis.del with glob)
  await deleteByPattern(`student:heatmap:${studentId}:*`);

  return updated;
};