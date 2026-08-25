/**
 * Lightweight Session Storage Cache Service
 * 
 * Caches high-frequency read queries (e.g. Current Affairs list, Exam catalog, Question Banks)
 * in browser sessionStorage with a configurable TTL (default 5 minutes).
 */

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_VERSION = 'v2_true_counts_2026';

// Auto-invalidate stale session storage on version upgrade
try {
  if (typeof sessionStorage !== 'undefined') {
    const currentVer = sessionStorage.getItem('oep_cache_ver');
    if (currentVer !== CACHE_VERSION) {
      Object.keys(sessionStorage).forEach(k => {
        if (k.startsWith('oep_')) {
          sessionStorage.removeItem(k);
        }
      });
      sessionStorage.setItem('oep_cache_ver', CACHE_VERSION);
    }
  }
} catch (e) {}

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
