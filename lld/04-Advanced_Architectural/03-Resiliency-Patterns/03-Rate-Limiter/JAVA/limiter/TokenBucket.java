package limiter;

/**
 * <h1>The Token Bucket Algorithm</h1>
 * 
 * <p>A highly efficient algorithm for Rate Limiting. 
 * Allows bursts of traffic up to the bucket capacity, 
 * then strictly enforces the refill rate.
 */
public class TokenBucket {
    
    private final long maxBucketSize;
    private final long refillRatePerSecond;

    private double currentTokens;
    private long lastRefillTimestamp;

    public TokenBucket(long maxBucketSize, long refillRatePerSecond) {
        this.maxBucketSize = maxBucketSize;
        this.refillRatePerSecond = refillRatePerSecond;
        this.currentTokens = maxBucketSize; // Start completely full
        this.lastRefillTimestamp = System.currentTimeMillis();
    }

    /**
     * Synchronized blocks ensure exact atomicity during multi-threaded API requests.
     */
    public synchronized boolean allowRequest(int tokensRequired) {
        refill();

        if (currentTokens >= tokensRequired) {
            currentTokens -= tokensRequired;
            System.out.println("   [Limiter] ✅ Allowed. Remaining tokens: " + (int)currentTokens);
            return true;
        }

        System.out.println("   [Limiter] 🛑 HTTP 429 Too Many Requests! Remaining: " + (int)currentTokens);
        return false;
    }

    private void refill() {
        long now = System.currentTimeMillis();
        double timeElapsedSeconds = (now - lastRefillTimestamp) / 1000.0;
        
        // Calculate how many tokens we should have accumulated during the elapsed time
        double tokensToAdd = timeElapsedSeconds * refillRatePerSecond;

        if (tokensToAdd > 0) {
            // Refill, but strictly cap it at the max Bucket Size!
            currentTokens = Math.min(maxBucketSize, currentTokens + tokensToAdd);
            lastRefillTimestamp = now;
        }
    }
}
