import 'server-only';
import { apiOk } from '@/lib/server/api-response';
import { withHandler } from '@/lib/server/route-handler';
import { checkUsernameAvailabilityService } from '@/lib/server/services/students/username.service';
import { ApiError } from '@/lib/server/utils/ApiError';

/**
 * GET /api/user/check-username?username=...&userId=...
 *
 * Used by the onboarding flow as the student types a desired username.
 * Wrapped in `withHandler` for two reasons:
 *   1. Rate-limiting — without this, 300 students typing letter-by-letter
 *      could fire thousands of DB lookups per minute against a single
 *      shared WiFi IP. Per-userId `api` limiter (200/15min) gives every
 *      authenticated student their own bucket so they can't starve each
 *      other.
 *   2. requireAuth — only logged-in students should be probing the
 *      username space. Unauthed callers now get a 401 instead of free
 *      database queries.
 */
export const GET = withHandler(
  async ({ query, user }) => {
    const username = query.get('username');
    // Default to the caller's own id so the service can exclude their
    // current username from the "taken" check. Callers can still pass an
    // explicit userId in the query string (admin tooling does this).
    const userIdParam = query.get('userId') ?? (user ? String(user.id) : undefined);

    if (!username) {
      throw new ApiError(400, 'Username parameter is required', [], 'REQUIRED_FIELD');
    }

    const result = await checkUsernameAvailabilityService({ username, userId: userIdParam });
    return apiOk(result);
  },
  { requireAuth: true, rateLimit: 'api' }
);
