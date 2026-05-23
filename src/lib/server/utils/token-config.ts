/**
 * Single source of truth for JWT and refresh-cookie lifetimes.
 *
 * Both the JWT (signed with `expiresIn`) and the refresh-token cookie
 * (`Max-Age` in seconds) must agree, otherwise the browser drops the cookie
 * before the JWT expires (or vice-versa) and silent token rotation breaks.
 *
 * Configure via env:
 *   ACCESS_TOKEN_EXPIRES   default "1d"   format: <number><s|m|h|d>
 *   REFRESH_TOKEN_EXPIRES  default "7d"   format: <number><s|m|h|d>
 */

export const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES ?? '1d';
export const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES ?? '7d';

export function expiryToSeconds(expr: string): number {
  const m = expr.trim().match(/^(\d+)([smhd])$/);
  if (!m) {
    throw new Error(
      `Invalid token expiry format: "${expr}". Expected e.g. "15m", "1h", "1d", "7d".`
    );
  }
  const n = parseInt(m[1], 10);
  switch (m[2]) {
    case 's': return n;
    case 'm': return n * 60;
    case 'h': return n * 3600;
    case 'd': return n * 86400;
    default:  throw new Error('unreachable');
  }
}

export const REFRESH_TOKEN_EXPIRES_SECONDS = expiryToSeconds(REFRESH_TOKEN_EXPIRES);
