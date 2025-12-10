/**
 * Error Logger Utility
 * Logs errors to Supabase for monitoring and debugging
 * 
 * LIMITS:
 * - Max 500 logs in database (auto-cleanup via SQL trigger)
 * - Logs older than 30 days auto-deleted
 * - Resolved logs older than 7 days auto-deleted
 * - Rate limiting: max 10 errors per minute per session
 */

import { supabase } from '../firebase';

export type ErrorType = 'runtime' | 'network' | 'validation' | 'authentication' | 'unknown';

export interface ErrorLogPayload {
    errorMessage: string;
    errorStack?: string;
    errorContext?: string; // Component/Page where error occurred
    errorType?: ErrorType;
    additionalInfo?: Record<string, any>;
}

// Rate limiting to prevent spam
const ERROR_RATE_LIMIT = 10; // max errors per minute
const ERROR_RATE_WINDOW = 60000; // 1 minute in ms
let errorCount = 0;
let lastResetTime = Date.now();

/**
 * Check if we can log (rate limiting)
 */
const canLogError = (): boolean => {
    const now = Date.now();

    // Reset counter if window passed
    if (now - lastResetTime > ERROR_RATE_WINDOW) {
        errorCount = 0;
        lastResetTime = now;
    }

    // Check rate limit
    if (errorCount >= ERROR_RATE_LIMIT) {
        if (import.meta.env.DEV) {
            console.warn('[ErrorLogger] Rate limit reached, skipping error log');
        }
        return false;
    }

    errorCount++;
    return true;
};

/**
 * Get current user info from Supabase session
 */
const getCurrentUserInfo = async (): Promise<{
    userId: string | null;
    userEmail: string | null;
    userRole: string | null;
}> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { userId: null, userEmail: null, userRole: null };
        }

        // Get user role from users table
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        return {
            userId: user.id,
            userEmail: user.email || null,
            userRole: userData?.role || null
        };
    } catch {
        return { userId: null, userEmail: null, userRole: null };
    }
};

/**
 * Determine error type from error object
 */
const getErrorType = (error: Error | unknown): ErrorType => {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();

        // Network errors
        if (message.includes('network') ||
            message.includes('fetch') ||
            message.includes('timeout') ||
            message.includes('connection') ||
            message.includes('failed to fetch')) {
            return 'network';
        }

        // Authentication errors
        if (message.includes('auth') ||
            message.includes('unauthorized') ||
            message.includes('forbidden') ||
            message.includes('permission') ||
            message.includes('token')) {
            return 'authentication';
        }

        // Validation errors
        if (message.includes('validation') ||
            message.includes('invalid') ||
            message.includes('required') ||
            message.includes('must be')) {
            return 'validation';
        }

        return 'runtime';
    }

    return 'unknown';
};

/**
 * Log error to Supabase
 * Rate limited to prevent spam (max 10 errors per minute)
 */
export const logError = async (
    error: Error | string,
    context?: string,
    additionalInfo?: Record<string, any>
): Promise<void> => {
    // Check rate limit first
    if (!canLogError()) {
        return;
    }

    try {
        const userInfo = await getCurrentUserInfo();
        const errorObj = error instanceof Error ? error : new Error(String(error));

        const payload = {
            userId: userInfo.userId,
            userEmail: userInfo.userEmail,
            userRole: userInfo.userRole,
            errorMessage: errorObj.message,
            errorStack: errorObj.stack || null,
            errorContext: context || null,
            errorType: getErrorType(errorObj),
            pageUrl: typeof window !== 'undefined' ? window.location.href : null,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
            additionalInfo: additionalInfo || null,
            createdAt: new Date().toISOString()
        };

        // Log to console in development
        if (import.meta.env.DEV) {
            console.error('[ErrorLogger]', payload);
        }

        // Insert to database
        const { error: insertError } = await supabase
            .from('error_logs')
            .insert(payload);

        if (insertError) {
            // Silently fail - don't want to create infinite error loops
            if (import.meta.env.DEV) {
                console.error('[ErrorLogger] Failed to insert error log:', insertError);
            }
        }
    } catch (loggingError) {
        // Silently fail - don't want to create infinite error loops
        if (import.meta.env.DEV) {
            console.error('[ErrorLogger] Exception while logging error:', loggingError);
        }
    }
};

/**
 * Log error with specific payload
 */
export const logErrorWithPayload = async (payload: ErrorLogPayload): Promise<void> => {
    try {
        const userInfo = await getCurrentUserInfo();

        const fullPayload = {
            userId: userInfo.userId,
            userEmail: userInfo.userEmail,
            userRole: userInfo.userRole,
            errorMessage: payload.errorMessage,
            errorStack: payload.errorStack || null,
            errorContext: payload.errorContext || null,
            errorType: payload.errorType || 'unknown',
            pageUrl: typeof window !== 'undefined' ? window.location.href : null,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
            additionalInfo: payload.additionalInfo || null,
            createdAt: new Date().toISOString()
        };

        // Log to console in development
        if (import.meta.env.DEV) {
            console.error('[ErrorLogger]', fullPayload);
        }

        // Insert to database
        const { error: insertError } = await supabase
            .from('error_logs')
            .insert(fullPayload);

        if (insertError && import.meta.env.DEV) {
            console.error('[ErrorLogger] Failed to insert error log:', insertError);
        }
    } catch (loggingError) {
        if (import.meta.env.DEV) {
            console.error('[ErrorLogger] Exception while logging error:', loggingError);
        }
    }
};

/**
 * Create a try-catch wrapper that automatically logs errors
 */
export const withErrorLogging = <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context: string
): T => {
    return (async (...args: Parameters<T>) => {
        try {
            return await fn(...args);
        } catch (error) {
            await logError(error as Error, context);
            throw error;
        }
    }) as T;
};

/**
 * Global error handler - can be used for window.onerror
 */
export const globalErrorHandler = (
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error
): void => {
    const errorMessage = error?.message || String(message);

    logError(
        error || new Error(errorMessage),
        'GlobalErrorHandler',
        {
            source,
            lineno,
            colno
        }
    );
};

/**
 * Promise rejection handler - can be used for window.onunhandledrejection
 */
export const unhandledRejectionHandler = (event: PromiseRejectionEvent): void => {
    const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

    logError(error, 'UnhandledRejection');
};

/**
 * Setup global error handlers
 */
export const setupGlobalErrorHandlers = (): void => {
    if (typeof window !== 'undefined') {
        window.onerror = globalErrorHandler;
        window.onunhandledrejection = unhandledRejectionHandler;

        if (import.meta.env.DEV) {
            console.log('[ErrorLogger] Global error handlers installed');
        }
    }
};

export default {
    logError,
    logErrorWithPayload,
    withErrorLogging,
    setupGlobalErrorHandlers
};
