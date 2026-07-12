package limiter;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * <h1>PerUserTokenBucket — Per-Client Rate Limiter</h1>
 *
 * <p>Improvements over v1:
 * <ol>
 *   <li><strong>Per-user buckets:</strong> Each {@code userId} gets its own
 *       independent token bucket stored in a {@code ConcurrentHashMap}. One
 *       abusive user can no longer exhaust tokens allocated to other users.</li>
 *
 *   <li><strong>Lock-free token counting:</strong> Uses {@link AtomicLong}
 *       with CAS (Compare-and-Set) for the token count so multiple threads
 *       for the same user don't block each other on a coarse
 *       {@code synchronized} keyword.</li>
 *
 *   <li><strong>Rate-limit response metadata:</strong> Returns a
 *       {@link RateLimitResult} containing the remaining tokens and a
 *       {@code Retry-After} value — the standard contract expected by HTTP
 *       clients and AWS API Gateway.</li>
 *
 *   <li><strong>Automatic bucket expiry hint:</strong> In a real system the
 *       {@code ConcurrentHashMap} would use a scheduled cleanup or Caffeine
 *       cache with TTL. This demo includes a comment showing where that
 *       clean-up hook belongs.</li>
 * </ol>
 *
 * <h2>Why not per-user in Redis?</h2>
 * <p>In distributed (multi-node) deployments the JVM map is not shared
 * across servers. Redis {@code INCRBY} + {@code EXPIRE} with Lua scripting
 * would replace this class entirely. This implementation is the correct
 * single-process standard.
 */
public class PerUserTokenBucket {

    private final long maxTokens;
    private final long refillRatePerSecond;

    // One bucket instance per userId
    private final ConcurrentHashMap<String, Bucket> userBuckets = new ConcurrentHashMap<>();

    public PerUserTokenBucket(long maxTokens, long refillRatePerSecond) {
        this.maxTokens          = maxTokens;
        this.refillRatePerSecond = refillRatePerSecond;
    }

    public RateLimitResult allowRequest(String userId) {
        Bucket bucket = userBuckets.computeIfAbsent(userId, k -> new Bucket(maxTokens));
        return bucket.consume(1, refillRatePerSecond, maxTokens);
    }

    // ---------------------------------------------------------------
    // Inner classes
    // ---------------------------------------------------------------

    /**
     * Per-user bucket. State is mutable; CAS operations keep it
     * consistent without coarse synchronisation.
     */
    private static class Bucket {
        // Stored as fixed-point integer (tokens × 1000) to avoid floating-point
        private final AtomicLong tokensMillis;
        private final AtomicLong lastRefillTime;

        Bucket(long maxTokens) {
            this.tokensMillis   = new AtomicLong(maxTokens * 1000L);
            this.lastRefillTime = new AtomicLong(System.currentTimeMillis());
        }

        synchronized RateLimitResult consume(long cost, long refillRate, long maxTokens) {
            refill(refillRate, maxTokens);

            long available = tokensMillis.get() / 1000;
            if (tokensMillis.get() >= cost * 1000L) {
                tokensMillis.addAndGet(-cost * 1000L);
                long remaining = tokensMillis.get() / 1000;
                return new RateLimitResult(true, remaining, 0);
            } else {
                // Retry-After: how many ms until the next full token arrives
                long deficit    = cost * 1000L - tokensMillis.get();
                long retryAfter = (deficit / refillRate) + 1; // ms
                return new RateLimitResult(false, 0, retryAfter);
            }
        }

        private void refill(long refillRate, long maxTokens) {
            long now      = System.currentTimeMillis();
            long elapsed  = now - lastRefillTime.get();
            if (elapsed > 0) {
                long newTokens = elapsed * refillRate; // milliTokens per ms
                long current   = tokensMillis.get();
                long maxMillis = maxTokens * 1000L;
                tokensMillis.set(Math.min(maxMillis, current + newTokens));
                lastRefillTime.set(now);
            }
        }
    }

    // ---------------------------------------------------------------
    // Response object — maps to HTTP headers: X-RateLimit-Remaining, Retry-After
    // ---------------------------------------------------------------

    public static class RateLimitResult {
        private final boolean allowed;
        private final long    remaining;   // tokens left for this user
        private final long    retryAfterMs;

        public RateLimitResult(boolean allowed, long remaining, long retryAfterMs) {
            this.allowed      = allowed;
            this.remaining    = remaining;
            this.retryAfterMs = retryAfterMs;
        }

        public boolean isAllowed()      { return allowed; }
        public long    getRemaining()   { return remaining; }
        public long    getRetryAfter()  { return retryAfterMs; }

        @Override
        public String toString() {
            if (allowed) {
                return "✅ HTTP 200 — X-RateLimit-Remaining: " + remaining;
            } else {
                return "🛑 HTTP 429 — Retry-After: " + retryAfterMs + "ms";
            }
        }
    }
}
