import 'server-only';
import { apiOk } from '@/lib/server/api-response';
import { NextRequest } from 'next/server';
import { getAuthUser, assertAdmin, assertTeacherOrAbove } from '@/lib/server/auth-helper';
import { resolveBatch } from '@/lib/server/batch-helper';
import { bulkDeleteClassesSchema } from '@/lib/server/schemas/topic.schema';
import { bulkDeleteClassesService } from '@/lib/server/services/topics/class.service';
import { CacheInvalidation } from '@/lib/server/utils/cacheInvalidation';
import { handleError } from '@/lib/server/error-response';

/**
 * Bulk-delete classes inside a topic. Body: { slugs: string[] }.
 * Uses POST (not DELETE) because some HTTP clients/proxies strip bodies from
 * DELETE — POST to a /bulk-delete sub-route is universally safe.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ batchSlug: string; topicSlug: string }> }
) {
  try {
    const user = getAuthUser(req);
    assertAdmin(user);
    assertTeacherOrAbove(user);

    const { batchSlug, topicSlug } = await params;
    const batch = await resolveBatch(batchSlug);

    const body = await req.json();
    const parsed = bulkDeleteClassesSchema.parse(body);

    const result = await bulkDeleteClassesService({
      batchId: batch.id,
      topicSlug,
      slugs: parsed.slugs,
    });

    if (result.deleted > 0) {
      await CacheInvalidation.invalidateBatch(batch.id);
    }

    return apiOk(
      result,
      `Deleted ${result.deleted} of ${result.requested} classes`
    );
  } catch (err) {
    return handleError(err);
  }
}
