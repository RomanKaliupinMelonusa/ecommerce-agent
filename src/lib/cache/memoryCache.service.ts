import type { ICacheService } from '../../interfaces/cache.types';

interface CacheEntry<T> {
    value: T;
    expiry: number | null; // null means never expires
}

export class MemoryCacheService implements ICacheService {
    private cache: Map<string, CacheEntry<unknown>> = new Map();
    private timers: Map<string, NodeJS.Timeout> = new Map(); // To handle TTL expiration

    async get<T>(key: string): Promise<T | null> {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        // Check expiry (although TTL via setTimeout is preferred)
        if (entry.expiry !== null && Date.now() > entry.expiry) {
            this.delete(key); // Clean up expired entry
            return null;
        }
        return entry.value as T;
    }

    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        this.clearExistingTimer(key); // Clear old timeout if overwriting

        let expiry: number | null = null;
        if (typeof ttlSeconds === 'number' && ttlSeconds > 0) {
            expiry = Date.now() + ttlSeconds * 1000;

            // Set timeout to auto-delete (handles TTL)
            const timer = setTimeout(() => {
                this.delete(key);
            }, ttlSeconds * 1000);
            // Unref so Node.js can exit if this is the only timer left
            timer.unref();
            this.timers.set(key, timer);
        }

        const entry: CacheEntry<T> = { value, expiry };
        this.cache.set(key, entry);
    }

     async delete(key: string): Promise<void> {
         this.clearExistingTimer(key);
         this.cache.delete(key);
     }

     private clearExistingTimer(key: string): void {
          const existingTimer = this.timers.get(key);
          if (existingTimer) {
              clearTimeout(existingTimer);
              this.timers.delete(key);
          }
     }
}
