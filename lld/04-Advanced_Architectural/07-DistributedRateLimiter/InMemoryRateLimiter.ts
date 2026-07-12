import { IRateLimiter, IRateLimitResult } from './IRateLimiter';

/**
 * In-Memory Rate Limiter.
 * Useful for local development or as a temporary fallback.
 * NOTE: This does not work in distributed environments.
 */
export class InMemoryRateLimiter implements IRateLimiter {
    private storage: Map<string, { count: number; expiry: number }> = new Map();

    async isAllowed(key: string, limit: number, windowInSeconds: number): Promise<IRateLimitResult> {
        const now = Date.now();
        const bucket = this.storage.get(key);

        if (!bucket || bucket.expiry < now) {
            // New bucket or expired
            const newBucket = { count: 1, expiry: now + windowInSeconds * 1000 };
            this.storage.set(key, newBucket);
            return {
                allowed: true,
                remaining: limit - 1,
                reset: Math.floor(newBucket.expiry / 1000)
            };
        }

        if (bucket.count >= limit) {
            return {
                allowed: false,
                remaining: 0,
                reset: Math.floor(bucket.expiry / 1000)
            };
        }

        bucket.count += 1;
        return {
            allowed: true,
            remaining: limit - bucket.count,
            reset: Math.floor(bucket.expiry / 1000)
        };
    }
}
