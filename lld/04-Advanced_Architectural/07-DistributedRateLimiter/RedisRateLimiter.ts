import { IRateLimiter, IRateLimitResult } from './IRateLimiter';

/**
 * Distributed Rate Limiter using Redis.
 * Uses Lua scripts for atomicity to prevent race conditions.
 */
export class RedisRateLimiter implements IRateLimiter {
    private redis: any; // Using 'any' for demonstration, would be a Redis client in production

    constructor(redisClient: any) {
        this.redis = redisClient;
    }

    /**
     * Lua script to increment and expire atomically.
     * Logic: 
     * 1. Get current count.
     * 2. If it's the first request (count == 0), set expiry.
     * 3. If count >= limit, block.
     * 4. Else, increment.
     */
    private readonly LUA_SCRIPT = `
        local key = KEYS[1]
        local limit = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])

        local current = redis.call('GET', key)
        if current and tonumber(current) >= limit then
            return {0, tonumber(current)}
        end

        local newVal = redis.call('INCR', key)
        if newVal == 1 then
            redis.call('EXPIRE', key, window)
        end

        return {1, newVal}
    `;

    async isAllowed(key: string, limit: number, windowInSeconds: number): Promise<IRateLimitResult> {
        try {
            // In a real implementation, we would use redis.eval()
            const [allowed, current] = await this.redis.eval(
                this.LUA_SCRIPT,
                1,
                key,
                limit.toString(),
                windowInSeconds.toString()
            );

            const remaining = Math.max(0, limit - current);
            
            return {
                allowed: allowed === 1,
                remaining,
                reset: Math.floor(Date.now() / 1000) + windowInSeconds // Simplified for LLD
            };
        } catch (error) {
            console.error('Redis Rate Limiter Error:', error);
            // This error should be handled by the Circuit Breaker in the middleware layer
            throw error; 
        }
    }
}
