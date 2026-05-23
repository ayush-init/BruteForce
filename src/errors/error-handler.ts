import { AppError, ErrorMapping } from './types';
import { createAppError, isNetworkError, isAuthError } from './error-factory';
import { getMappedError, getMappedErrorByCode, hasMappedError, getErrorAction } from './error-mapper';
import { showError, showWarning, showSuccess } from '@/ui/toast';

/**
 * Error Handler - Industry-level error handling system
 * Priority: errorCode > statusCode > backend message > fallback
 * Actions: toast | inline | logout | refresh | redirect | silent
 */

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface HandlerOptions {
  /** Context for logging/debugging (e.g., 'login', 'profile-update') */
  context?: string;
  /** Force specific handling behavior */
  forceAction?: 'toast' | 'inline' | 'silent';
  /** Fallback message if no mapping found */
  fallbackMessage?: string;
  /** Custom redirect path for logout/redirect actions */
  redirectPath?: string;
  /** Whether to skip automatic action execution (manual mode) */
  manual?: boolean;
}

export interface ErrorResult {
  /** Normalized error object */
  error: AppError;
  /** User-friendly message */
  message: string;
  /** Error type for styling */
  type: 'error' | 'warning' | 'info';
  /** Recommended action */
  action: ErrorMapping['action'];
  /** Whether an action was executed */
  actionExecuted: boolean;
}

// =============================================================================
// RESOLUTION FUNCTIONS (Priority: errorCode > statusCode > message > fallback)
// =============================================================================

/**
 * Resolve error mapping (highest priority wins)
 */
function resolveErrorMapping(appError: AppError): ErrorMapping | undefined {
  // 1. errorCode mapping (highest priority)
  if (appError.errorCode) {
    const codeMapping = getMappedErrorByCode(appError.errorCode);
    if (codeMapping) return codeMapping;
  }

  // 2. statusCode mapping (fallback)
  if (hasMappedError(appError.statusCode)) {
    return getMappedError(appError.statusCode);
  }

  return undefined;
}

/**
 * Resolve user-friendly message
 */
function resolveErrorMessage(appError: AppError, options?: HandlerOptions): string {
  const mapping = resolveErrorMapping(appError);

  if (mapping) {
    // Some mappings (e.g. duplicate-resource errors) want the dynamic
    // backend message — which usually contains the specific item name —
    // shown instead of a static "already exists" string. Fall back to the
    // static message only if the backend didn't supply anything.
    if (mapping.useBackendMessage && appError.message) {
      return appError.message;
    }
    return mapping.message;
  }

  // Use backend message for client errors (4xx), not server errors (5xx)
  if (appError.statusCode >= 400 && appError.statusCode < 500 && appError.message) {
    return appError.message;
  }

  // Final fallback
  return options?.fallbackMessage || 'Something went wrong. Please try again.';
}

/**
 * Resolve user-friendly title
 */
function resolveErrorTitle(appError: AppError, type: 'error' | 'warning' | 'info'): string {
  const mapping = resolveErrorMapping(appError);

  if (mapping?.title) {
    return mapping.title;
  }

  // Default titles based on error type
  if (type === 'warning') return 'Warning';
  if (type === 'info') return 'Info';
  return 'Error';
}

/**
 * Resolve error type for UI styling
 */
function resolveErrorType(appError: AppError): 'error' | 'warning' | 'info' {
  const mapping = resolveErrorMapping(appError);
  
  if (mapping?.type) {
    return mapping.type;
  }

  // Default: auth errors = warning, others = error
  if (isAuthError(appError)) {
    return 'warning';
  }

  return 'error';
}

/**
 * Resolve action based on error and options
 */
function resolveAction(appError: AppError, options?: HandlerOptions): ErrorMapping['action'] {
  // Force action from options takes precedence
  if (options?.forceAction) {
    return options.forceAction;
  }

  // Check errorCode specific action
  if (appError.errorCode) {
    const action = getErrorAction(appError.errorCode);
    if (action) return action;
  }

  // Check statusCode default action
  const statusMapping = getMappedError(appError.statusCode);
  if (statusMapping?.action) {
    return statusMapping.action;
  }

  // Default to toast
  return 'toast';
}

// =============================================================================
// ACTION HANDLERS
// =============================================================================

/**
 * Execute toast notification action
 */
function executeToast(title: string, message: string, type: 'error' | 'warning' | 'info'): void {
  switch (type) {
    case 'warning':
      showWarning(title, message);
      break;
    case 'info':
      showSuccess(title, message);
      break;
    case 'error':
    default:
      showError(title, message);
      break;
  }
}

/**
 * Execute logout action - clear tokens and redirect
 */
function executeLogout(redirectPath: string = '/login'): void {
  if (typeof window === 'undefined') return;

  // Clear all auth storage
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // Clear cookies
  document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

  // Redirect after brief delay to allow toast to be seen
  setTimeout(() => {
    window.location.href = redirectPath;
  }, 1500);
}

/**
 * Execute refresh token action
 * NOTE: This sets a flag that the API client interceptors check
 */
function executeTokenRefresh(): void {
  if (typeof window === 'undefined') return;
  
  // Set a flag in sessionStorage that API client checks
  sessionStorage.setItem('tokenRefreshRequested', 'true');
  
  // Dispatch custom event for immediate handling if needed
  window.dispatchEvent(new CustomEvent('tokenRefreshRequired'));
}

// =============================================================================
// LOGGING
// =============================================================================

function logError(appError: AppError, result: ErrorResult, options?: HandlerOptions): void {
  if (process.env.NODE_ENV !== 'development') return;

  console.group(`🚨 Error ${options?.context ? `[${options.context}]` : ''}`);
  console.error('Status Code:', appError.statusCode);
  console.error('Error Code:', appError.errorCode || 'N/A');
  console.error('Message:', result.message);
  console.error('Type:', result.type);
  console.error('Action:', result.action);
  console.error('Action Executed:', result.actionExecuted);
  console.error('Original Error:', appError.originalError);
  console.groupEnd();
}

// =============================================================================
// MAIN ERROR HANDLER
// =============================================================================

/**
 * Main error handling function - Processes errors with full action support
 * 
 * Usage:
 *   handleError(error) - Automatic handling based on error code
 *   handleError(error, { context: 'login' }) - With logging context
 *   handleError(error, { forceAction: 'inline' }) - Force inline error
 *   handleError(error, { manual: true }) - Get result without executing actions
 */
export function handleError(error: unknown, options?: HandlerOptions): ErrorResult {
  // Normalize error
  const appError = createAppError(error);

  // Resolve error properties
  const message = resolveErrorMessage(appError, options);
  const type = resolveErrorType(appError);
  const title = resolveErrorTitle(appError, type);
  const action = resolveAction(appError, options);

  // Build result object
  const result: ErrorResult = {
    error: appError,
    message,
    type,
    action,
    actionExecuted: false,
  };

  // Execute action if not in manual mode
  if (!options?.manual) {
    switch (action) {
      case 'inline':
        // Don't show toast - caller handles inline display
        break;

      case 'silent':
        // No UI feedback
        break;

      case 'logout':
        result.actionExecuted = true;
        executeToast(title, message, type);
        executeLogout(options?.redirectPath);
        break;

      case 'refresh':
        result.actionExecuted = true;
        executeTokenRefresh();
        // Don't show toast for refresh - it's automatic
        break;

      case 'redirect':
        result.actionExecuted = true;
        executeToast(title, message, type);
        if (typeof window !== 'undefined' && options?.redirectPath) {
          setTimeout(() => {
            window.location.href = options.redirectPath!;
          }, 1500);
        }
        break;

      case 'toast':
      default:
        result.actionExecuted = true;
        executeToast(title, message, type);
        break;
    }
  }

  // Log for debugging
  logError(appError, result, options);

  return result;
}

// =============================================================================
// SPECIALIZED HANDLERS
// =============================================================================

/**
 * Handle error silently - Normalize only, no UI or actions
 * Useful for background operations or when you handle UI yourself
 */
export function handleErrorSilent(error: unknown): AppError {
  return createAppError(error);
}

/**
 * Get error details without triggering any actions
 * Perfect for form handling where you want to control the display
 */
export function getErrorDetails(error: unknown, options?: Omit<HandlerOptions, 'manual'>): ErrorResult {
  return handleError(error, { ...options, manual: true });
}

/**
 * Get only the error message string
 * Simple helper for quick message extraction
 */
export function getErrorMessage(error: unknown, options?: HandlerOptions): string {
  const result = handleError(error, { ...options, manual: true });
  return result.message;
}

// =============================================================================
// PREDICATE CHECKERS
// =============================================================================

/**
 * Check if error is a network error
 */
export function checkIsNetworkError(error: unknown): boolean {
  const appError = createAppError(error);
  return isNetworkError(appError);
}

/**
 * Check if error is an authentication error (401/403)
 */
export function checkIsAuthError(error: unknown): boolean {
  const appError = createAppError(error);
  return isAuthError(appError);
}

/**
 * Check if error requires logout action
 */
export function requiresLogout(error: unknown): boolean {
  const appError = createAppError(error);
  const action = resolveAction(appError, {});
  return action === 'logout';
}

/**
 * Check if error can be recovered with token refresh
 */
export function canRefreshToken(error: unknown): boolean {
  const appError = createAppError(error);
  return appError.errorCode === 'TOKEN_EXPIRED';
}

