import { IRateLimiter } from './IRateLimiter';

/**
 * PRODUCTION-READY MIDDLEWARE
 * Demonstrates: 
 * 1. Fail-Open Strategy with Circuit Breaker
 * 2. Context-Aware Keying (User-ID vs IP)
 * 3. Observability (Metrics & Tracing)
 */
export class RateLimitMiddleware {
    private limiter: IRateLimiter;
    private circuitBreaker: any; // e.g., Opossum CircuitBreaker

    constructor(limiter: IRateLimiter, circuitBreaker: any) {
        this.limiter = limiter;
        this.circuitBreaker = circuitBreaker;
    }

    /**
     * Express-style middleware implementation
     */
    async handle(req: any, res: any, next: any) {
        const userId = req.user?.id;
        const userIp = req.ip;

        // 1. CONTEXT-AWARE KEYING
        // UID for logged-in users, IP for anonymous to prevent different types of attacks.
        const key = userId ? `ratelimit:uid:${userId}` : `ratelimit:ip:${userIp}`;
        
        // Configuration can be dynamic based on endpoint or user tier
        const limit = req.routeConfig?.limit || 100;
        const window = req.routeConfig?.window || 60;

        try {
            // 2. CIRCUIT BREAKER WRAPPER
            // If Redis is slow or down, the circuit breaker will 'fail-open'
            const result = await this.circuitBreaker.fire(key, limit, window);

            // 3. OBSERVABILITY: METRICS
            // metrics.increment('api_ratelimit_checked', { allowed: result.allowed });

            // Set Headers
            res.setHeader('X-RateLimit-Limit', limit);
            res.setHeader('X-RateLimit-Remaining', result.remaining);
            res.setHeader('X-RateLimit-Reset', result.reset);

            if (!result.allowed) {
                // metrics.increment('api_ratelimit_blocked');
                return res.status(429).json({
                    error: 'Too Many Requests',
                    message: 'Please try again later.'
                });
            }

            next();
        } catch (error) {
            // 4. FAIL-OPEN STRATEGY (The "Pro Move")
            // If the circuit breaker is open (Redis is down), we allow the request.
            // Availability > Strict Rate Limiting during infrastructure failure.
            console.warn('Rate Limiter Failed-Open due to Infrastructure Error:', error.message);
            
            // metrics.increment('api_ratelimit_error_fail_open');
            
            // Still proceed to ensure user experience isn't broken
            next();
        }
    }
}
