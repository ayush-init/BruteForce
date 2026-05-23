/**
 * Error Types - Central type definitions for the error handling system
 */

export interface AppError {
  statusCode: number;
  message: string;
  errorCode?: string;
  originalError?: unknown;
}

export interface BackendErrorResponse {
  statusCode: number;
  message: string;
  code?: string;
}

export interface ErrorMapping {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  action?: ErrorAction;
  /**
   * If true, the error handler will prefer the backend's dynamic message
   * over the static `message` field on this mapping. Use this when the
   * server returns context-specific details (e.g. duplicate item's name)
   * that the user needs to see in the toast/inline error.
   *
   * The static `message` is kept as a fallback in case the backend message
   * is empty.
   */
  useBackendMessage?: boolean;
}

export type ErrorType = 'error' | 'warning' | 'info' | 'success';

export type ErrorAction = 
  | 'toast'      // Show toast notification (default for most errors)
  | 'inline'     // Return message for form display (no toast)
  | 'logout'     // Clear tokens and redirect to login
  | 'refresh'    // Trigger token refresh flow
  | 'redirect'   // Redirect to specific path
  | 'silent';    // No UI feedback (for background operations)

export const COMMON_ERROR_CODES = {
  // === AUTHENTICATION (401/403) ===
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_MISSING: 'TOKEN_MISSING',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Token Operations
  TOKEN_GENERATION_ERROR: 'TOKEN_GENERATION_ERROR',
  TOKEN_VERIFICATION_ERROR: 'TOKEN_VERIFICATION_ERROR',
  MISSING_SECRET: 'MISSING_SECRET',

  // === VALIDATION (400) ===
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  INVALID_EMAIL_FORMAT: 'INVALID_EMAIL_FORMAT',
  BAD_REQUEST: 'BAD_REQUEST',

  // === USER/STUDENT RESOURCES ===
  STUDENT_NOT_FOUND: 'STUDENT_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  USERNAME_EXISTS: 'USERNAME_EXISTS',
  USERNAME_TAKEN: 'USERNAME_TAKEN',
  ENROLLMENT_ID_EXISTS: 'ENROLLMENT_ID_EXISTS',

  // === OTHER RESOURCES (404/409) ===
  NOT_FOUND: 'NOT_FOUND',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  QUESTION_NOT_FOUND: 'QUESTION_NOT_FOUND',
  TOPIC_NOT_FOUND: 'TOPIC_NOT_FOUND',
  BATCH_NOT_FOUND: 'BATCH_NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  CONFLICT: 'CONFLICT',
  QUESTION_LINK_EXISTS: 'QUESTION_LINK_EXISTS',
  NO_BATCH_ASSIGNED: 'NO_BATCH_ASSIGNED',

  // === ADMIN RESOURCES (409) ===
  CITY_EXISTS: 'CITY_EXISTS',
  BATCH_DUPLICATE: 'BATCH_DUPLICATE',
  USER_EXISTS: 'USER_EXISTS',

  // === DATABASE (400/500) ===
  DATABASE_ERROR: 'DATABASE_ERROR',
  INVALID_REFERENCE: 'INVALID_REFERENCE',

  // === SERVER (500) ===
  SERVER_ERROR: 'SERVER_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EMAIL_CONFIG_MISSING: 'EMAIL_CONFIG_MISSING',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  EMAIL_SEND_ERROR: 'EMAIL_SEND_ERROR',
} as const;

export type ErrorCode = typeof COMMON_ERROR_CODES[keyof typeof COMMON_ERROR_CODES];
