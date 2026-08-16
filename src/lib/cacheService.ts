/**
 * Lightweight Session Storage Cache Service
 * 
 * Caches high-frequency read queries (e.g. Current Affairs list, Exam catalog, Question Banks)
 * in browser sessionStorage with a configurable TTL (default 5 minutes).
 * 
 * Guarantees:
 * - 0 impact on UI or component behavior
 * - Automatic cache expiration after TTL
 * - Instant clearing when admin mutations occur
 * - Safe fallback if sessionStorage is unavailable or full
 */

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const cacheService = {
  get<T>(key: string, ttlMs: number = DEFAULT_TTL_MS): T | null {
    try {
      const raw = sessionStorage.getItem(`oep_cache_${key}`);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);
      const isExpired = Date.now() - entry.timestamp > ttlMs;

      if (isExpired) {
        sessionStorage.removeItem(`oep_cache_${key}`);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  },

  set<T>(key: string, data: T): void {
    try {
      const entry: CacheEntry<T> = {
        timestamp: Date.now(),
        data
      };
      sessionStorage.setItem(`oep_cache_${key}`, JSON.stringify(entry));
    } catch {
      // Ignore quota exceeded or storage disabled
    }
  },

  clear(keyPrefix?: string): void {
    try {
      if (!keyPrefix) {
        Object.keys(sessionStorage).forEach(k => {
          if (k.startsWith('oep_cache_')) {
            sessionStorage.removeItem(k);
          }
        });
        return;
      }

      Object.keys(sessionStorage).forEach(k => {
        if (k.startsWith(`oep_cache_${keyPrefix}`)) {
          sessionStorage.removeItem(k);
        }
      });
    } catch {
      // Ignore
    }
  }
};
