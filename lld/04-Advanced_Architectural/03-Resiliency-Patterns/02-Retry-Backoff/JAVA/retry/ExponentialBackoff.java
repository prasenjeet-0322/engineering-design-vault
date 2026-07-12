package retry;

import service.DatabaseService;

/**
 * <h1>The Retry Decorator</h1>
 * 
 * <p>Wraps the flaky service and implements Exponential Backoff logic.
 */
public class ExponentialBackoff {

    private final DatabaseService dbRef;
    private final int maxRetries = 5;
    private final long initialDelayMs = 500;

    public ExponentialBackoff(DatabaseService db) {
        this.dbRef = db;
    }

    public String fetchWithRetries() {
        int attempt = 0;
        long backoffDelay = initialDelayMs;

        while (attempt < maxRetries) {
            try {
                // Happy path: the DB succeeds!
                return dbRef.executeQuery();
                
            } catch (Exception e) {
                attempt++;
                System.out.println("     -> ❌ Failed. Reason: " + e.getMessage());

                if (attempt >= maxRetries) {
                    return "🛑 Operation aborted after " + maxRetries + " failed attempts.";
                }

                System.out.println("     ⏳ Waiting " + backoffDelay + "ms before retrying...\n");
                try {
                    Thread.sleep(backoffDelay);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }

                // Exponentially scale the wait time (500ms > 1000ms > 2000ms)
                backoffDelay = backoffDelay * 2;
            }
        }
        return "FATAL ERROR";
    }
}
