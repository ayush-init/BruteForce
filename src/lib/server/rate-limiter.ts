import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { redisConnection as redis } from '@/lib/server/config/redis';

export type LimiterName = 'loginIP' | 'loginEmail' | 'heavy' | 'api' | 'api_admin' | 'bulk' | 'public';

const LIMITERS: Record<LimiterName, { windowSec: number; max: number }> = {
  // Auth — IP based. Raised to 2000/5min so a single shared WiFi (e.g.
  // a classroom of 300+ students all signing in via Google OAuth from the
  // same public IP) has headroom for retries, post-login token refreshes,
  // and the occasional double-click. At ~1 login + ~1 refresh per student
  // worst-case, 300 students = ~600 hits; 2000 gives ~3× safety buffer.
  
  loginIP:    { windowSec: 5 * 60,  max: 2000 },
  // Auth — email based (brute force protection: 10 attempts per 15 min per email)
  loginEmail: { windowSec: 15 * 60, max: 10   },
  // Authenticated heavy routes — per userId (practice, leaderboard)
  heavy:      { windowSec: 60,      max: 20   },
  // Authenticated regular routes — per userId (topics, bookmarks, recent).
  // Routes are configured with rateLimit: 'api', but route-handler.ts
  // automatically promotes admin users to the api_admin bucket below.
  // So this 200 cap effectively only applies to student/public-authed traffic.
  api:        { windowSec: 15 * 60, max: 200  },
  // Same routes, but for admin/teacher users — admin workflows (creating
  // classes, batch-assigning questions, navigating between batch/topic/
  // class views) routinely fire 100-200 requests in a 15-min window once
  // layout refetches and React Query background refreshes are counted.
  // Routes don't need to opt in — withHandler swaps 'api' → 'api_admin'
  // based on user.userType.
  api_admin:  { windowSec: 15 * 60, max: 300  },
  // Bulk upload — per userId/IP (slow ops, low limit)
  bulk:       { windowSec: 15 * 60, max: 5    },
  // Public unauthenticated routes — per IP
  public:     { windowSec: 15 * 60, max: 200  },
};

const SLIDING_WINDOW_SCRIPT = `
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local windowMs = tonumber(ARGV[2])
  local limit = tonumber(ARGV[3])
  redis.call('ZREMRANGEBYSCORE', key, '-inf', now - windowMs)
  local count = redis.call('ZCARD', key)
  if count < limit then
    redis.call('ZADD', key, now, now .. math.random())
    redis.call('PEXPIRE', key, windowMs)
    return 0
  end
  return 1
`;

interface RateLimitOptions {
  userId?: string | number;
  email?: string;
}

/**
 * Apply rate limiting to a route.
 *
 * Key priority:
 *  1. userId  → rl:{limiter}:{userId}   (authenticated routes)
 *  2. email   → rl:{limiter}:{email}    (login brute-force)
 *  3. IP      → rl:{limiter}:{ip}       (fallback / public)
 */
export async function applyRateLimit(
  req: NextRequest,
  limiterName: LimiterName,
  options: RateLimitOptions = {}
): Promise<NextResponse | null> {
  const config = LIMITERS[limiterName];

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  let identifier: string;
  if (options.userId !== undefined) {
    identifier = String(options.userId);
  } else if (options.email) {
    identifier = options.email.toLowerCase().trim();
  } else {
    identifier = ip;
  }

  const key = `rl:${limiterName}:${identifier}`;
  const now = Date.now();
  const windowMs = config.windowSec * 1000;

  try {
    const result = await (redis as any).eval(
      SLIDING_WINDOW_SCRIPT,
      1,
      key,
      now,
      windowMs,
      config.max
    );

    if (result === 1) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many requests. Please wait a moment and try again.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(config.windowSec) },
        }
      );
    }
  } catch (err) {
    // Redis down — fail open, never block users due to infra issue
    console.error('[RATE_LIMITER] Redis error, failing open:', err);
  }

  return null;
}
