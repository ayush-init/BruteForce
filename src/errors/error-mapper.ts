import { ErrorMapping } from './types';

/**
 * Error Mapper - Comprehensive error mapping system
 * Maps HTTP status codes and backend error codes to user-friendly messages with actions
 * Priority: errorCode > statusCode > fallback
 */

// =============================================================================
// STATUS CODE MAPPINGS (Fallback when errorCode not available)
// =============================================================================
export const ERROR_MAPPINGS: Record<number, ErrorMapping> = {
  0: {
    title: 'Connection Failed',
    message: 'Something went wrong. Please try again.',
    type: 'error',
    action: 'logout', // Redirect to login when server is down
  },
  400: {
    title: 'Invalid Request',
    message: 'Please check your input and try again.',
    type: 'error',
    action: 'toast',
  },
  401: {
    title: 'Session Expired',
    message: 'Your session has expired. Please log in again.',
    type: 'warning',
    action: 'logout', // Generic 401 defaults to logout
  },
  403: {
    title: 'Access Denied',
    message: "You don't have access to this.",
    type: 'error',
    action: 'toast',
  },
  404: {
    title: 'Not Found',
    message: 'The requested resource was not found.',
    type: 'error',
    action: 'toast',
  },
  408: {
    title: 'Request Timeout',
    message: 'The request timed out. Please try again.',
    type: 'warning',
    action: 'toast',
  },
  409: {
    title: 'Already Exists',
    message: 'This resource already exists.',
    type: 'warning',
    action: 'toast',
  },
  422: {
    title: 'Invalid Input',
    message: 'We could not process your request. Please check your input.',
    type: 'error',
    action: 'toast',
  },
  429: {
    title: 'Too Many Requests',
    message: 'Too many requests. Please wait a moment and try again.',
    type: 'warning',
    action: 'toast',
  },
  500: {
    title: 'Server Error',
    message: 'Something went wrong on our side. Please try again later.',
    type: 'error',
    action: 'toast',
  },
  502: {
    title: 'Service Unavailable',
    message: 'Service temporarily unavailable. Please try again later.',
    type: 'warning',
    action: 'toast',
  },
  503: {
    title: 'Service Unavailable',
    message: 'Service temporarily unavailable. Please try again later.',
    type: 'warning',
    action: 'toast',
  },
  504: {
    title: 'Service Unavailable',
    message: 'Service temporarily unavailable. Please try again later.',
    type: 'warning',
    action: 'toast',
  },
};

// =============================================================================
// ERROR CODE MAPPINGS (Higher priority than status codes)
// Organized by HTTP status code groups for clarity
// =============================================================================
export const ERROR_CODE_MAPPINGS: Record<string, ErrorMapping> = {
  // ===========================================================================
  // AUTHENTICATION ERRORS (401 Unauthorized)
  // ===========================================================================

  /**
   * INVALID_TOKEN - Token validation failed (expired or invalid), attempt refresh
   * Action: refresh - Try to get new access token using refresh token
   */
  INVALID_TOKEN: {
    title: 'Session Expired',
    message: 'Your session has expired. Refreshing...',
    type: 'info',
    action: 'refresh',
  },

  /**
   * TOKEN_EXPIRED - Token has passed its expiration time
   * Action: refresh - Try to get new access token using refresh token
   */
  TOKEN_EXPIRED: {
    title: 'Session Expired',
    message: 'Your session has expired. Refreshing...',
    type: 'info',
    action: 'refresh',
  },

  /**
   * TOKEN_MISSING - No authorization header or token provided
   * Action: logout - Redirect to login
   */
  TOKEN_MISSING: {
    title: 'Login Required',
    message: 'Please log in to continue.',
    type: 'warning',
    action: 'logout',
  },

  /**
   * INVALID_CREDENTIALS - Login attempt with wrong email/password
   * Action: toast - Show toast notification
   */
  INVALID_CREDENTIALS: {
    title: 'Invalid Credentials',
    message: 'Invalid email or password. Please try again.',
    type: 'error',
    action: 'toast',
  },

  /**
   * UNAUTHORIZED - Generic authentication failure
   * Action: logout - Clear session
   */
  UNAUTHORIZED: {
    title: 'Unauthorized',
    message: 'Please log in to continue.',
    type: 'warning',
    action: 'logout',
  },

  // ===========================================================================
  // AUTHORIZATION ERRORS (403 Forbidden)
  // ===========================================================================

  /**
   * INSUFFICIENT_PERMISSIONS - User lacks required role/permission
   * Action: toast - Show access denied message
   */
  INSUFFICIENT_PERMISSIONS: {
    title: 'Access Denied',
    message: "You don't have permission to perform this action.",
    type: 'error',
    action: 'toast',
  },

  // ===========================================================================
  // VALIDATION ERRORS (400 Bad Request)
  // ===========================================================================

  /**
   * VALIDATION_ERROR - Generic validation failure
   * Action: inline - Form validation errors should show inline
   */
  VALIDATION_ERROR: {
    title: 'Validation Error',
    message: 'Please check your input and try again.',
    type: 'error',
    action: 'inline',
  },

  /**
   * INVALID_OTP - OTP verification failed (wrong code or expired)
   * Action: toast - Show specific OTP error toast
   */
  INVALID_OTP: {
    title: 'Invalid OTP',
    message: 'Invalid or expired OTP. Please try again.',
    type: 'error',
    action: 'toast',
  },

  /**
   * SAME_AS_OLD_PASSWORD - Reset password flow: user typed their current
   * password as the new one. Backend rejects without consuming the OTP so
   * the user can retry with a different password within the same 10-min window.
   * Action: toast - Show specific, actionable message instead of the generic
   * "Invalid Request" that a bare 400 would render.
   */
  SAME_AS_OLD_PASSWORD: {
    title: 'Pick a different password',
    message: 'Your new password must be different from your current password.',
    type: 'warning',
    action: 'toast',
  },

  /**
   * INVALID_INPUT - Malformed or incorrect input format
   * Action: inline - Form field error
   */
  INVALID_INPUT: {
    title: 'Invalid Input',
    message: 'Invalid input provided.',
    type: 'error',
    action: 'inline',
  },

  /**
   * REQUIRED_FIELD - Missing required field
   * Action: inline - Show on specific field
   */
  REQUIRED_FIELD: {
    title: 'Required Field',
    message: 'This field is required.',
    type: 'warning',
    action: 'inline',
  },

  /**
   * INVALID_PASSWORD - Password doesn't meet requirements
   * Action: inline - Show password field error
   */
  INVALID_PASSWORD: {
    title: 'Weak Password',
    message: 'Password does not meet requirements.',
    type: 'error',
    action: 'inline',
  },

  /**
   * INVALID_EMAIL_FORMAT - Email format validation failed
   * Action: inline - Show email field error
   */
  INVALID_EMAIL_FORMAT: {
    title: 'Invalid Email',
    message: 'Please enter a valid email address.',
    type: 'error',
    action: 'inline',
  },

  /**
   * BAD_REQUEST - Generic bad request
   * Action: toast - General user feedback
   */
  BAD_REQUEST: {
    title: 'Bad Request',
    message: 'Invalid request. Please try again.',
    type: 'error',
    action: 'toast',
  },

  /**
   * QUESTION_LINK_EXISTS - Duplicate question URL.
   * The backend returns a dynamic message that includes the name of the
   * existing question (e.g. "A question already exists with the name
   * 'Two Sum' for this link") so the admin can immediately identify
   * which question is the duplicate. `useBackendMessage` makes the
   * handler use that dynamic message instead of the static fallback below.
   * Action: toast — surface it prominently; the form also shows it inline.
   */
  QUESTION_LINK_EXISTS: {
    title: 'Duplicate Link',
    message: 'A question with this link already exists.',
    type: 'warning',
    action: 'toast',
    useBackendMessage: true,
  },

  /**
   * NO_BATCH_ASSIGNED - Student operation requires batch
   * Action: toast - Inform user
   */
  NO_BATCH_ASSIGNED: {
    title: 'No Batch Assigned',
    message: 'You are not assigned to any batch. Please contact admin.',
    type: 'warning',
    action: 'toast',
  },

  /**
   * INVALID_REFERENCE - Foreign key constraint failure
   * Action: toast - General error
   */
  INVALID_REFERENCE: {
    title: 'Invalid Reference',
    message: 'Invalid reference. The related item may have been deleted.',
    type: 'error',
    action: 'toast',
  },

  // ===========================================================================
  // RESOURCE NOT FOUND ERRORS (404)
  // ===========================================================================

  /**
   * STUDENT_NOT_FOUND - Student record doesn't exist
   * Action: toast - Inform user
   */
  STUDENT_NOT_FOUND: {
    title: 'Student Not Found',
    message: 'Student not found.',
    type: 'error',
    action: 'toast',
  },

  /**
   * USER_NOT_FOUND - User account doesn't exist
   * Action: toast - Login/registration context
   */
  USER_NOT_FOUND: {
    title: 'User Not Found',
    message: 'User not found. Please check your credentials.',
    type: 'error',
    action: 'toast',
  },

  /**
   * NOT_FOUND - Generic resource not found
   * Action: toast - General message
   */
  NOT_FOUND: {
    title: 'Not Found',
    message: 'The requested resource was not found.',
    type: 'error',
    action: 'toast',
  },

  /**
   * NOT_FOUND_ERROR - Record not found (Prisma P2025)
   * Action: toast - General message
   */
  NOT_FOUND_ERROR: {
    title: 'Record Not Found',
    message: 'Record not found. It may have been deleted.',
    type: 'error',
    action: 'toast',
  },

  /**
   * QUESTION_NOT_FOUND - Specific question missing
   * Action: toast - Inform user
   */
  QUESTION_NOT_FOUND: {
    title: 'Question Not Found',
    message: 'Question not found.',
    type: 'error',
    action: 'toast',
  },

  /**
   * TOPIC_NOT_FOUND - Topic/Subject missing
   * Action: toast - Inform user
   */
  TOPIC_NOT_FOUND: {
    title: 'Topic Not Found',
    message: 'Topic not found.',
    type: 'error',
    action: 'toast',
  },

  /**
   * BATCH_NOT_FOUND - Batch/class missing
   * Action: toast - Inform user
   */
  BATCH_NOT_FOUND: {
    title: 'Batch Not Found',
    message: 'Batch not found.',
    type: 'error',
    action: 'toast',
  },

  // ===========================================================================
  // CONFLICT ERRORS (409)
  // ===========================================================================

  /**
   * EMAIL_EXISTS - Email already used by another account.
   * The backend returns a dynamic message naming the existing student
   * (e.g. `This email is already used by "Ayush Chaurasiya" (enrollment
   * ID: 2401010024)`), so `useBackendMessage` makes the handler surface
   * that detail instead of the static fallback below.
   */
  EMAIL_EXISTS: {
    title: 'Email Taken',
    message: 'An account with this email already exists.',
    type: 'warning',
    action: 'toast',
    useBackendMessage: true,
  },

  /**
   * USERNAME_EXISTS - Username already taken by another student.
   * Dynamic backend message names the existing owner; see EMAIL_EXISTS
   * for the pattern.
   */
  USERNAME_EXISTS: {
    title: 'Username Taken',
    message: 'This username is already taken.',
    type: 'warning',
    action: 'toast',
    useBackendMessage: true,
  },

  /**
   * USERNAME_TAKEN - Profile/onboarding username conflict.
   * Backend supplies a contextual message — e.g. "This username was just
   * taken by someone else — please pick a different one." when the race
   * fires during onboarding. `useBackendMessage: true` makes that detail
   * reach the toast instead of the static fallback below.
   */
  USERNAME_TAKEN: {
    title: 'Username Taken',
    message: 'This username is already taken.',
    type: 'warning',
    action: 'toast',
    useBackendMessage: true,
  },

  /**
   * ENROLLMENT_ID_EXISTS - Enrollment ID already assigned to another
   * student. Dynamic backend message names the existing owner; see
   * EMAIL_EXISTS for the pattern.
   */
  ENROLLMENT_ID_EXISTS: {
    title: 'Duplicate Enrollment ID',
    message: 'This enrollment ID already exists.',
    type: 'warning',
    action: 'toast',
    useBackendMessage: true,
  },

  /**
   * DUPLICATE_ENTRY - Generic duplicate
   * Action: toast - General message
   */
  DUPLICATE_ENTRY: {
    title: 'Already Exists',
    message: 'This item already exists.',
    type: 'warning',
    action: 'toast',
  },

  /**
   * CONFLICT - Generic resource conflict
   * Action: toast - General message
   */
  CONFLICT: {
    title: 'Conflict',
    message: 'This resource conflicts with an existing one.',
    type: 'warning',
    action: 'toast',
  },

  /**
   * CITY_EXISTS - Duplicate city name
   * Action: toast - Show specific message for city
   */
  CITY_EXISTS: {
    title: 'City Exists',
    message: 'City already exists.',
    type: 'warning',
    action: 'toast',
  },

  /**
   * BATCH_DUPLICATE - Duplicate batch name in same city/year
   * Action: toast - Show specific message for batch
   */
  BATCH_DUPLICATE: {
    title: 'Batch Exists',
    message: 'Batch already exists in this city and year.',
    type: 'warning',
    action: 'toast',
  },

  /**
   * USER_EXISTS - Duplicate admin email
   * Action: inline - Show on email field
   */
  USER_EXISTS: {
    title: 'Email Taken',
    message: 'Email already exists.',
    type: 'warning',
    action: 'inline',
  },

  // ===========================================================================
  // DATABASE ERRORS (500)
  // ===========================================================================

  /**
   * DATABASE_ERROR - Database operation failure
   * Action: toast - Generic server error message
   */
  DATABASE_ERROR: {
    title: 'Database Error',
    message: 'Something went wrong. Please try again later.',
    type: 'error',
    action: 'toast',
  },

  // ===========================================================================
  // SERVER ERRORS (500)
  // ===========================================================================

  /**
   * SERVER_ERROR - Generic server error
   * Action: toast - Apologetic message
   */
  SERVER_ERROR: {
    title: 'Server Error',
    message: 'Something went wrong on our side. Please try again later.',
    type: 'error',
    action: 'toast',
  },

  /**
   * INTERNAL_ERROR - Internal server error (catch-all)
   * Action: toast - Generic message
   */
  INTERNAL_ERROR: {
    title: 'Unexpected Error',
    message: 'An unexpected error occurred. Please try again.',
    type: 'error',
    action: 'toast',
  },

  /**
   * TOKEN_GENERATION_ERROR - Failed to create JWT
   * Action: toast - Login/registration affected
   */
  TOKEN_GENERATION_ERROR: {
    title: 'Auth Failed',
    message: 'Unable to complete authentication. Please try again.',
    type: 'error',
    action: 'toast',
  },

  /**
   * TOKEN_VERIFICATION_ERROR - Failed to verify JWT
   * Action: logout - Session issue
   */
  TOKEN_VERIFICATION_ERROR: {
    title: 'Session Invalid',
    message: 'Session verification failed. Please log in again.',
    type: 'error',
    action: 'logout',
  },

  /**
   * MISSING_SECRET - Server config error (should never reach frontend)
   * Action: toast - Generic error
   */
  MISSING_SECRET: {
    title: 'Service Unavailable',
    message: 'Authentication service unavailable. Please try again later.',
    type: 'error',
    action: 'toast',
  },

  /**
   * EMAIL_CONFIG_MISSING - Server email setup issue
   * Action: toast - Inform about email issues
   */
  EMAIL_CONFIG_MISSING: {
    title: 'Email Unavailable',
    message: 'Email service is currently unavailable.',
    type: 'warning',
    action: 'toast',
  },

  /**
   * EXTERNAL_SERVICE_ERROR - LeetCode/GFG API failure
   * Action: toast - Inform about external issue
   */
  EXTERNAL_SERVICE_ERROR: {
    title: 'External Service Down',
    message: 'External service temporarily unavailable.',
    type: 'warning',
    action: 'toast',
  },

  /**
   * FILE_UPLOAD_ERROR - S3 or file processing failure
   * Action: toast - Upload specific error
   */
  FILE_UPLOAD_ERROR: {
    title: 'Upload Failed',
    message: 'Failed to upload file. Please try again.',
    type: 'error',
    action: 'toast',
  },

  /**
   * EMAIL_SEND_ERROR - Email delivery failure
   * Action: toast - Inform about email failure
   */
  EMAIL_SEND_ERROR: {
    title: 'Email Failed',
    message: 'Failed to send email. Please try again.',
    type: 'warning',
    action: 'toast',
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get mapped error for a status code (fallback mapping)
 * @returns ErrorMapping or undefined if no mapping exists
 */
export function getMappedError(statusCode: number): ErrorMapping | undefined {
  return ERROR_MAPPINGS[statusCode];
}

/**
 * Get mapped error for an error code (highest priority)
 * @returns ErrorMapping or undefined if no mapping exists
 */
export function getMappedErrorByCode(errorCode: string): ErrorMapping | undefined {
  return ERROR_CODE_MAPPINGS[errorCode];
}

/**
 * Check if a status code has a mapped message
 */
export function hasMappedError(statusCode: number): boolean {
  return statusCode in ERROR_MAPPINGS;
}

/**
 * Check if an error code has a mapped configuration
 */
export function hasErrorCodeMapping(errorCode: string): boolean {
  return errorCode in ERROR_CODE_MAPPINGS;
}

/**
 * Get action for an error code (convenience function)
 * @returns The action type or 'toast' as default
 */
export function getErrorAction(errorCode: string): ErrorMapping['action'] {
  const mapping = ERROR_CODE_MAPPINGS[errorCode];
  return mapping?.action ?? 'toast';
}
