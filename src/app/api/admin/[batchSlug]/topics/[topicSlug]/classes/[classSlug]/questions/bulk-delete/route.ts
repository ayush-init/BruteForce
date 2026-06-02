import 'server-only';
import { apiOk } from '@/lib/server/api-response';
import { NextRequest } from 'next/server';
import { getAuthUser, assertAdmin, assertTeacherOrAbove } from '@/lib/server/auth-helper';
import { resolveBatch } from '@/lib/server/batch-helper';
import { bulkRemoveQuestionsFromClassSchema } from '@/lib/server/schemas/topic.schema';
import { bulkRemoveQuestionsFromClassService } from '@/lib/server/services/questions/visibility.service';
import { CacheInvalidation } from '@/lib/server/utils/cacheInvalidation';
import { handleError } from '@/lib/server/error-response';

/**
 * Bulk-remove assigned questions from a class. Body: { ids: number[] }.
 * POST sub-route to dodge the "DELETE-bodies-get-stripped" footgun.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ batchSlug: string; topicSlug: string; classSlug: string }> }
) {
  try {
    const user = getAuthUser(req);
    assertAdmin(user);
    assertTeacherOrAbove(user);

    const { batchSlug, topicSlug, classSlug } = await params;
    const batch = await resolveBatch(batchSlug);

    const body = await req.json();
    const parsed = bulkRemoveQuestionsFromClassSchema.parse(body);

    const result = await bulkRemoveQuestionsFromClassService({
      batchId: batch.id,
      topicSlug,
      classSlug,
      questionIds: parsed.ids,
    });

    if (result.deleted > 0) {
      await CacheInvalidation.invalidateBatch(batch.id);
    }

    return apiOk(
      result,
      `Removed ${result.deleted} of ${result.requested} questions`
    );
  } catch (err) {
    return handleError(err);
  }
}
