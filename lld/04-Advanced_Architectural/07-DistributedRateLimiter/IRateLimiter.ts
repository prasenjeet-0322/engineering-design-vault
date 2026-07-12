/**
 * Interface for Rate Limiting strategies.
 * Following the Interface Segregation and Strategy Pattern.
 */
export interface IRateLimitResult {
    allowed: boolean;
    remaining: number;
    reset: number; // Unix timestamp in seconds
}

export interface IRateLimiter {
    /**
     * Checks if a request is allowed for a given key.
     * @param key The unique identifier for the rate limit bucket (e.g., user ID or IP)
     * @param limit Maximum number of requests allowed in the window
     * @param windowInSeconds The time window size in seconds
     */
    isAllowed(key: string, limit: number, windowInSeconds: number): Promise<IRateLimitResult>;
}
