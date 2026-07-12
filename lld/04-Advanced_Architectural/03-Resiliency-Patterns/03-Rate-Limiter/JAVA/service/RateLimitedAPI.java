package service;

import limiter.TokenBucket;

public class RateLimitedAPI {
    
    private final TokenBucket tokenBucket;

    public RateLimitedAPI(TokenBucket tokenBucket) {
        this.tokenBucket = tokenBucket;
    }

    public String fetchSecureData() {
        // Attempt to consume 1 token per API request
        boolean isAllowed = tokenBucket.allowRequest(1);

        if (isAllowed) {
            return "200 OK: Secure Data Delivered.";
        } else {
            return "429 ERROR: Too Many Requests.";
        }
    }
}
