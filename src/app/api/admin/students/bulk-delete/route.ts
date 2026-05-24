import 'server-only';
import { apiOk } from '@/lib/server/api-response';
import { withHandler } from '@/lib/server/route-handler';
import { bulkDeleteStudentsSchema } from '@/lib/server/schemas/student.schema';
import { bulkDeleteStudentsService } from '@/lib/server/services/students/student.service';
import { CacheInvalidation } from '@/lib/server/utils/cacheInvalidation';

/**
 * Bulk-delete students. Body: { ids: number[] }.
 * Uses POST (not DELETE) because some HTTP clients/proxies strip bodies from
 * DELETE requests — POST to a /bulk-delete sub-route is universally safe.
 */
export const POST = withHandler(
  async ({ body }) => {
    const { ids } = body as { ids: number[] };
    const result = await bulkDeleteStudentsService(ids);
    // Bulk deletes can span many batches; rebuild leaderboards once instead
    // of per-student to keep this cheap.
    await CacheInvalidation.invalidateAllLeaderboards();
    return apiOk(
      result,
      `Deleted ${result.deleted} of ${result.requested} students`
    );
  },
  {
    requireAuth: true,
    requireRole: 'teacherOrAbove',
    rateLimit: 'api',
    bodySchema: bulkDeleteStudentsSchema,
  }
);
