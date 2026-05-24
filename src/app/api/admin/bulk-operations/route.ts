import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, assertAdmin } from '@/lib/server/auth-helper';
import { bulkStudentUploadService } from '@/lib/server/services/bulk.service';
import { handleError } from '@/lib/server/error-response';
import { ApiError } from '@/lib/server/utils/ApiError';
import { CacheInvalidation } from '@/lib/server/utils/cacheInvalidation';
import { applyRateLimit } from '@/lib/server/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    assertAdmin(user);

    const limited = await applyRateLimit(req, 'bulk', { userId: user.id });
    if (limited) return limited;

    const formData = await req.formData().catch(() => {
      throw new ApiError(400, 'Invalid multipart form data');
    });

    const batch_id = formData.get('batch_id');
    if (!batch_id) throw new ApiError(400, 'batch_id is required');

    const fileField = formData.get('file') as File | null;
    if (!fileField) throw new ApiError(400, 'CSV file is required (field name: "file")');

    // Default password every bulk-uploaded student logs in with on day one.
    // Required — without it students would be created with NULL password_hash
    // and could never log in. Min 6 chars matches our standard policy.
    const defaultPasswordRaw = formData.get('default_password');
    const defaultPassword = typeof defaultPasswordRaw === 'string' ? defaultPasswordRaw.trim() : '';
    if (!defaultPassword) throw new ApiError(400, 'default_password is required');
    if (defaultPassword.length < 6) throw new ApiError(400, 'default_password must be at least 6 characters');

    const buffer = Buffer.from(await fileField.arrayBuffer());

    const result = await bulkStudentUploadService(buffer, { batch_id: Number(batch_id), defaultPassword });
    await CacheInvalidation.invalidateBatch(Number(batch_id));
    await CacheInvalidation.invalidateAllLeaderboards();
    return NextResponse.json(
      { message: 'Students upload successful', ...(typeof result === 'object' && result ? result : {}) },
      { status: 201 }
    );
  } catch (err) {
    return handleError(err);
  }
}
