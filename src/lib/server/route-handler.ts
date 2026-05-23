import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '@/lib/server/utils/ApiError';
import { applyRateLimit, LimiterName } from '@/lib/server/rate-limiter';
import { verifyAccessToken } from '@/lib/server/utils/jwt.util';
import { AccessTokenPayload } from '@/lib/server/types/auth.types';
import { handleError, formatZodErrors } from '@/lib/server/error-response';

type RequiredRole = 'student' | 'admin' | 'superadmin' | 'teacherOrAbove';

export interface HandlerContext {
  user?: AccessTokenPayload;
  body?: unknown;
  query: URLSearchParams;
  params: Record<string, string>;
  rawRequest: NextRequest;
}

export interface HandlerOptions {
  /**
   * Which rate limiter to apply:
   * - loginIP   → per IP  (login routes, checked before auth)
   * - heavy     → per userId (practice, leaderboard — checked after auth)
   * - api       → per userId (topics, bookmarks, recent — checked after auth)
   * - bulk      → per userId (file uploads — checked after auth)
   * - public    → per IP  (public routes, checked before auth)
   */
  rateLimit?: LimiterName;
  /**
   * Also apply loginEmail limiter using email from request body.
   * Use on login routes to prevent brute force per account.
   */
  rateLimitEmail?: boolean;
  requireAuth?: boolean;
  requireRole?: RequiredRole;
  bodySchema?: ZodSchema;
  querySchema?: ZodSchema;
  paramsSchema?: ZodSchema;
}

function checkRole(user: AccessTokenPayload, role: RequiredRole): void {
  switch (role) {
    case 'student':
      if (user.userType !== 'student') {
        throw new ApiError(403, 'Access denied. Students only.', [], 'INSUFFICIENT_PERMISSIONS');
      }
      break;
    case 'admin':
      if (user.userType !== 'admin') {
        throw new ApiError(403, 'Access denied. Admins only.', [], 'INSUFFICIENT_PERMISSIONS');
      }
      break;
    case 'superadmin':
      if (user.userType !== 'admin' || user.role !== 'SUPERADMIN') {
        throw new ApiError(403, 'Access denied. Superadmin only.', [], 'INSUFFICIENT_PERMISSIONS');
      }
      break;
    case 'teacherOrAbove':
      if (user.userType !== 'admin' || (user.role !== 'SUPERADMIN' && user.role !== 'TEACHER')) {
        throw new ApiError(403, 'Access denied. Teacher or Superadmin only.', [], 'INSUFFICIENT_PERMISSIONS');
      }
      break;
  }
}

const IP_LIMITERS: LimiterName[] = ['loginIP', 'public'];
const USER_LIMITERS: LimiterName[] = ['heavy', 'api', 'api_admin', 'bulk'];

export function withHandler(
  handler: (ctx: HandlerContext) => Promise<NextResponse>,
  options: HandlerOptions = {}
) {
  return async (
    req: NextRequest,
    routeCtx: { params?: Promise<Record<string, string>> | Record<string, string> } = {}
  ): Promise<NextResponse> => {
    try {
      // ── Step 1: IP-based rate limit (before auth, no userId needed) ──────────
      if (options.rateLimit && IP_LIMITERS.includes(options.rateLimit)) {
        const limited = await applyRateLimit(req, options.rateLimit);
        if (limited) return limited;
      }

      // ── Step 2: Email-based rate limit (read body early for email) ───────────
      // We read the raw body once here so both email-limiting AND Zod validation
      // can use it without consuming the stream twice.
      let rawBody: unknown = undefined;
      const needsBody =
        options.rateLimitEmail ||
        (options.bodySchema && ['POST', 'PUT', 'PATCH'].includes(req.method));

      if (needsBody) {
        const contentType = req.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          rawBody = await req.json().catch(() => ({}));
        } else {
          rawBody = {};
        }
      }

      if (options.rateLimitEmail && rawBody) {
        const email = (rawBody as Record<string, unknown>)?.email;
        if (typeof email === 'string' && email) {
          const limited = await applyRateLimit(req, 'loginEmail', { email });
          if (limited) return limited;
        }
      }

      // ── Step 3: Auth verification ────────────────────────────────────────────
      let user: AccessTokenPayload | undefined;
      if (options.requireAuth) {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          throw new ApiError(401, 'No token provided', [], 'NO_TOKEN');
        }
        const token = authHeader.split(' ')[1];
        user = verifyAccessToken(token);
      }

      // ── Step 4: userId-based rate limit (after auth, per user) ───────────────
      // Admin/teacher users on the general 'api' limiter are promoted to the
      // higher 'api_admin' bucket (300/15min vs 200/15min). Admin workflows
      // legitimately fire many more requests than student workflows. Routes
      // don't need to opt in — they keep `rateLimit: 'api'` and we swap here.
      if (options.rateLimit && USER_LIMITERS.includes(options.rateLimit) && user) {
        const effectiveLimiter: LimiterName =
          options.rateLimit === 'api' && user.userType === 'admin'
            ? 'api_admin'
            : options.rateLimit;
        const limited = await applyRateLimit(req, effectiveLimiter, { userId: user.id });
        if (limited) return limited;
      }

      // ── Step 5: Role check ───────────────────────────────────────────────────
      if (options.requireRole && user) {
        checkRole(user, options.requireRole);
      }

      // ── Step 6: Body validation (use already-read body) ──────────────────────
      let body: unknown;
      if (options.bodySchema && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const result = options.bodySchema.safeParse(rawBody ?? {});
        if (!result.success) {
          throw new ApiError(
            400,
            'Validation failed',
            formatZodErrors(result.error),
            'VALIDATION_ERROR'
          );
        }
        body = result.data;
      }

      // ── Step 7: Query validation ─────────────────────────────────────────────
      const querySearchParams = new URL(req.url).searchParams;
      if (options.querySchema) {
        const rawQuery = Object.fromEntries(querySearchParams.entries());
        const result = options.querySchema.safeParse(rawQuery);
        if (!result.success) {
          throw new ApiError(
            400,
            'Invalid query parameters',
            formatZodErrors(result.error),
            'VALIDATION_ERROR'
          );
        }
      }

      // ── Step 8: Route params ─────────────────────────────────────────────────
      let params: Record<string, string> = {};
      if (routeCtx.params) {
        params = routeCtx.params instanceof Promise
          ? await routeCtx.params
          : routeCtx.params;
      }

      if (options.paramsSchema) {
        const result = options.paramsSchema.safeParse(params);
        if (!result.success) {
          throw new ApiError(
            400,
            'Invalid URL parameters',
            formatZodErrors(result.error),
            'VALIDATION_ERROR'
          );
        }
      }

      // ── Step 9: Call handler ─────────────────────────────────────────────────
      return await handler({ user, body, query: querySearchParams, params, rawRequest: req });
    } catch (err) {
      return handleError(err);
    }
  };
}

export function setRefreshTokenCookie(response: NextResponse, refreshToken: string): void {
  response.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
}

export function clearRefreshTokenCookie(response: NextResponse): void {
  response.cookies.set('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
