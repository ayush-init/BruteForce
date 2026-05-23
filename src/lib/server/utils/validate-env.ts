/**
 * Startup env-var validation.
 * Called once from instrumentation.ts before any worker / cron / DB code runs.
 *
 * Fails fast with a clear list of every missing variable so the operator can
 * fix all of them at once instead of discovering them one by one at runtime.
 *
 * Skipped from this list:
 * - NODE_ENV / *_EXPIRES — have safe defaults in code
 * - SUPERADMIN_* — only needed by the seed:superadmin script, not at runtime
 * - EMAIL_USER / EMAIL_PASS / EMAIL_SERVICE — deprecated after the SES migration;
 *   kept in .env temporarily for rollback but no longer read by the code
 */

const REQUIRED_RUNTIME_ENV_VARS = [
  // Database
  'DATABASE_URL',

  // JWT
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',

  // Google OAuth
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NEXT_PUBLIC_GOOGLE_CLIENT_ID',

  // AWS — credentials shared by S3 (image uploads) and SES (transactional email).
  // The IAM user behind AWS_ACCESS_KEY must have BOTH s3:* and ses:SendEmail
  // permissions, and SES must be set up in the same region/account those
  // credentials point to.
  'AWS_ACCESS_KEY',
  'AWS_SECRET_KEY',
  'AWS_REGION',
  'AWS_BUCKET_NAME',

  // AWS SES — verified sender identity (email or domain address)
  'AWS_SES_FROM_ADDRESS',

  // Redis
  'CLOUD_REDIS_URL',
] as const;

export function validateEnv(): void {
  const missing = REQUIRED_RUNTIME_ENV_VARS.filter(name => !process.env[name]);

  if (missing.length > 0) {
    console.error('\n❌  [STARTUP] Missing required environment variables:');
    for (const name of missing) {
      console.error(`     • ${name}`);
    }
    console.error(`\n     Set them in .env or your deployment environment, then restart.\n`);
    throw new Error(
      `Startup aborted — missing env vars: ${missing.join(', ')}`
    );
  }

  console.log(`✅  [STARTUP] All ${REQUIRED_RUNTIME_ENV_VARS.length} required env vars present`);
}
