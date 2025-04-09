// src/interfaces/cache.types.ts
export interface ICacheService {
    /**
     * Retrieves an item from the cache.
     * @param key The cache key.
     * @returns A promise resolving to the cached item or null if not found/expired.
     */
    get<T>(key: string): Promise<T | null>;

    /**
     * Stores an item in the cache.
     * @param key The cache key.
     * @param value The value to store.
     * @param ttlSeconds Optional Time-To-Live in seconds. Behavior depends on implementation.
     * @returns A promise resolving when the operation is complete.
     */
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

     /**
      * Deletes an item from the cache.
      * @param key The cache key.
      * @returns A promise resolving when the operation is complete.
      */
     delete(key: string): Promise<void>;
}
