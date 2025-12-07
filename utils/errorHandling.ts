/**
 * Error Handling & Retry Logic
 * Automatic retry untuk network failures
 * Exponential backoff strategy
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  shouldRetry: (error: any) => {
    // Retry on network errors, timeouts, or 5xx errors
    if (error.message?.includes('Network')) return true;
    if (error.message?.includes('timeout')) return true;
    if (error.status >= 500) return true;
    return false;
  },
};

/**
 * Calculate exponential backoff delay
 */
const getBackoffDelay = (
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number => {
  const delay = initialDelay * Math.pow(multiplier, attempt - 1);
  return Math.min(delay, maxDelay);
};

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry wrapper for async functions
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (!opts.shouldRetry(error) || attempt === opts.maxRetries) {
        throw error;
      }

      // Calculate backoff delay
      const delay = getBackoffDelay(
        attempt,
        opts.initialDelayMs,
        opts.maxDelayMs,
        opts.backoffMultiplier
      );

      if (import.meta.env.DEV) {
        console.warn(
          `[Retry] Attempt ${attempt}/${opts.maxRetries} failed, retrying in ${delay}ms:`,
          error.message
        );
      }

      await sleep(delay);
    }
  }

  throw lastError;
};

/**
 * Retry wrapper for queries
 */
export const withQueryRetry = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> => {
  try {
    return await withRetry(
      () => queryFn(),
      {
        ...DEFAULT_RETRY_OPTIONS,
        ...options,
        shouldRetry: (error: any) => {
          // Retry on network errors but not on data validation errors
          if (error?.code === '404' || error?.code === '400') return false;
          return options.shouldRetry?.(error) ?? true;
        },
      }
    );
  } catch (error) {
    return {
      data: null,
      error,
    };
  }
};

/**
 * Error boundary wrapper
 */
export const handleError = (
  error: any,
  context: string = 'Unknown'
): { message: string; recoverable: boolean } => {
  const isNetwork = error?.message?.includes('Network') || error?.code === 'NETWORK_ERROR';
  const isTimeout = error?.message?.includes('timeout');
  const isServer = error?.status >= 500;

  const recoverable = isNetwork || isTimeout || isServer;
  const message = isNetwork
    ? 'Network error - please check your connection'
    : isTimeout
    ? 'Request timeout - please try again'
    : isServer
    ? 'Server error - please try again later'
    : error?.message || 'An unexpected error occurred';

  if (import.meta.env.DEV) {
    console.error(`[Error] ${context}:`, { error, recoverable, message });
  }

  return { message, recoverable };
};

/**
 * Batch retry - retry multiple operations
 */
export const withBatchRetry = async <T>(
  fns: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<Array<{ success: boolean; result?: T; error?: any }>> => {
  return Promise.all(
    fns.map(async fn => {
      try {
        const result = await withRetry(fn, options);
        return { success: true, result };
      } catch (error) {
        return { success: false, error };
      }
    })
  );
};

export default {
  withRetry,
  withQueryRetry,
  handleError,
  withBatchRetry,
};
