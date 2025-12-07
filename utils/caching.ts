/**
 * Request Caching Strategy
 * Cache frequently accessed data untuk reduce database queries
 * Implements 5-minute TTL caching untuk forms, brands, users
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

interface CacheStore {
  [key: string]: CacheEntry<any>;
}

const CACHE_STORE: CacheStore = {};

// Default cache TTL (5 minutes)
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * Set cache entry
 */
export const setCacheEntry = <T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_TTL
): void => {
  CACHE_STORE[key] = {
    data,
    timestamp: Date.now(),
    ttl,
  };
};

/**
 * Get cache entry if valid
 */
export const getCacheEntry = <T>(key: string): T | null => {
  const entry = CACHE_STORE[key];

  if (!entry) {
    return null;
  }

  const now = Date.now();
  const age = now - entry.timestamp;

  // Check if cache expired
  if (age > entry.ttl) {
    delete CACHE_STORE[key];
    return null;
  }

  return entry.data as T;
};

/**
 * Clear specific cache entry
 */
export const clearCacheEntry = (key: string): void => {
  delete CACHE_STORE[key];
};

/**
 * Clear all cache
 */
export const clearAllCache = (): void => {
  Object.keys(CACHE_STORE).forEach(key => {
    delete CACHE_STORE[key];
  });
};

/**
 * Cache wrapper for queries
 * Returns cached data if available, otherwise executes query and caches result
 */
export const cacheQuery = async <T>(
  key: string,
  queryFn: () => Promise<{ data: T | null; error: any }>,
  ttl: number = DEFAULT_TTL
): Promise<{ data: T | null; error: any }> => {
  // Check cache first
  const cached = getCacheEntry<T>(key);
  if (cached !== null) {
    return { data: cached, error: null };
  }

  // Execute query if not cached
  try {
    const result = await queryFn();
    
    // Cache successful result
    if (result.data) {
      setCacheEntry(key, result.data, ttl);
    }
    
    return result;
  } catch (error) {
    return {
      data: null,
      error,
    };
  }
};

/**
 * Get cache stats
 */
export const getCacheStats = (): { entries: number; totalSize: number } => {
  const entries = Object.keys(CACHE_STORE).length;
  const totalSize = JSON.stringify(CACHE_STORE).length;
  
  return { entries, totalSize };
};

/**
 * Cache invalidation strategy
 * Automatically clear old entries
 */
export const cleanupExpiredCache = (): number => {
  const now = Date.now();
  let cleaned = 0;

  Object.keys(CACHE_STORE).forEach(key => {
    const entry = CACHE_STORE[key];
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      delete CACHE_STORE[key];
      cleaned++;
    }
  });

  return cleaned;
};

// Cleanup expired cache every minute
if (typeof window !== 'undefined') {
  setInterval(() => {
    const cleaned = cleanupExpiredCache();
    if (cleaned > 0 && import.meta.env.DEV) {
      console.log(`[Cache] Cleaned up ${cleaned} expired entries`);
    }
  }, 60 * 1000);
}

export default {
  setCacheEntry,
  getCacheEntry,
  clearCacheEntry,
  clearAllCache,
  cacheQuery,
  getCacheStats,
  cleanupExpiredCache,
};
