package retry;

import java.util.Random;
import java.util.function.Supplier;

/**
 * <h1>RetryPolicy v2 — Jitter, Caps, Selective Retry</h1>
 *
 * <p>Improvements over v1:
 * <ol>
 *   <li><strong>Jitter:</strong> Adds random noise to backoff delays so
 *       1,000 simultaneously-failing clients don't all retry at the
 *       exact same millisecond, creating another coordinated surge on
 *       the recovering server (the "Thundering Herd" problem).</li>
 *
 *   <li><strong>Max delay cap:</strong> Exponential growth is capped at
 *       {@link #maxDelayMs} (default 8s). Without a cap, 10 retries
 *       would wait 256 seconds — unusable for user-facing APIs.</li>
 *
 *   <li><strong>Selective retry:</strong> Only exceptions marked as
 *       "retryable" are retried. A {@code 400 Bad Request} (invalid
 *       data) should never be retried; it will always fail. Only
 *       transient errors ({@code 503}, {@code 429}, network timeouts)
 *       should trigger a retry.</li>
 *
 *   <li><strong>Generic Supplier&lt;T&gt;:</strong> Works with any
 *       callable returning any type — DB queries, HTTP calls, file I/O.</li>
 * </ol>
 *
 * @param <T> return type of the retried operation
 */
public class RetryPolicy<T> {

    public static final long DEFAULT_MAX_DELAY_MS = 8_000; // never wait longer than 8s

    private final int    maxRetries;
    private final long   initialDelayMs;
    private final long   maxDelayMs;
    private final Random jitterSource = new Random();

    public RetryPolicy(int maxRetries, long initialDelayMs) {
        this(maxRetries, initialDelayMs, DEFAULT_MAX_DELAY_MS);
    }

    public RetryPolicy(int maxRetries, long initialDelayMs, long maxDelayMs) {
        this.maxRetries     = maxRetries;
        this.initialDelayMs = initialDelayMs;
        this.maxDelayMs     = maxDelayMs;
    }

    // ---------------------------------------------------------------
    // Core execute method
    // ---------------------------------------------------------------

    public T execute(Supplier<T> operation) {
        int  attempt   = 0;
        long delay     = initialDelayMs;

        while (true) {
            try {
                return operation.get();

            } catch (RetryableException e) {
                // Transient failure — eligible for retry
                attempt++;
                System.out.println("   ⚠️  Attempt " + attempt + "/" + maxRetries
                                   + " failed (retryable): " + e.getMessage());

                if (attempt >= maxRetries) {
                    throw new RuntimeException(
                        "🛑 Exhausted " + maxRetries + " retries. Giving up.", e);
                }

                long sleepMs = withJitter(delay);
                System.out.println("   ⏳ Waiting " + sleepMs + "ms (delay=" + delay
                                   + " + jitter) before retry " + (attempt + 1) + "...\n");
                sleep(sleepMs);

                // Exponential growth, capped at maxDelayMs
                delay = Math.min(delay * 2, maxDelayMs);

            } catch (NonRetryableException e) {
                // Permanent failure — do NOT retry (e.g. 400, 401, 404)
                System.out.println("   🚫 Non-retryable error: " + e.getMessage()
                                   + ". Aborting immediately.");
                throw new RuntimeException("Non-retryable failure: " + e.getMessage(), e);
            }
        }
    }

    // ---------------------------------------------------------------
    // Jitter helpers
    // ---------------------------------------------------------------

    /**
     * Full Jitter: random value in [0, delay].
     * AWS recommends "Decorrelated Jitter" for distributed systems but
     * Full Jitter is simpler and good enough for most cases.
     */
    private long withJitter(long delay) {
        return (long) (jitterSource.nextDouble() * delay);
    }

    private void sleep(long ms) {
        try { Thread.sleep(ms); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }

    // ---------------------------------------------------------------
    // Marker exception types — callers throw these to signal retry intent
    // ---------------------------------------------------------------

    /**
     * Throw this for transient failures that should be retried:
     * network timeouts, 503 Service Unavailable, 429 Too Many Requests.
     */
    public static class RetryableException extends RuntimeException {
        public RetryableException(String msg) { super(msg); }
    }

    /**
     * Throw this for permanent failures that must NOT be retried:
     * 400 Bad Request, 401 Unauthorized, 404 Not Found, validation errors.
     */
    public static class NonRetryableException extends RuntimeException {
        public NonRetryableException(String msg) { super(msg); }
    }
}
