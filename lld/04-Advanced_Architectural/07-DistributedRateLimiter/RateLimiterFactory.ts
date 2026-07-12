import { IRateLimiter } from './IRateLimiter';
import { RedisRateLimiter } from './RedisRateLimiter';
import { InMemoryRateLimiter } from './InMemoryRateLimiter';

export enum RateLimiterType {
    REDIS = 'REDIS',
    IN_MEMORY = 'IN_MEMORY'
}

/**
 * Factory Pattern to instantiate the appropriate rate limiting strategy.
 * This encapsulates the complexity of infrastructure dependencies.
 */
export class RateLimiterFactory {
    static create(type: RateLimiterType, config: any): IRateLimiter {
        switch (type) {
            case RateLimiterType.REDIS:
                if (!config.redisClient) {
                    throw new Error('Redis client is required for RedisRateLimiter');
                }
                return new RedisRateLimiter(config.redisClient);
            
            case RateLimiterType.IN_MEMORY:
                return new InMemoryRateLimiter();
            
            default:
                throw new Error(`Unsupported Rate Limiter Type: ${type}`);
        }
    }
}
