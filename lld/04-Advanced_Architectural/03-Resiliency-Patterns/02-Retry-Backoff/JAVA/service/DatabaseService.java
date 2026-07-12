package service;

import retry.RetryPolicy;

/**
 * <h1>DatabaseService v2</h1>
 * 
 * <p>Now throws typed exceptions so the RetryPolicy can distinguish
 * transient errors (retry) from permanent errors (abort immediately).
 */
public class DatabaseService {

    private int attemptCounter = 0;

    // Simulates: fail twice with transient error, succeed on 3rd
    public String executeQuery() {
        attemptCounter++;
        System.out.println("   [DB] Attempt #" + attemptCounter + "...");

        if (attemptCounter == 1) {
            throw new RetryPolicy.RetryableException("503 Service Unavailable — DB overload");
        }
        if (attemptCounter == 2) {
            throw new RetryPolicy.RetryableException("Network timeout — connection reset by peer");
        }
        return "200 OK — User record loaded.";
    }

    /** Simulates a permanently invalid request — should NEVER be retried */
    public String executeBadQuery() {
        throw new RetryPolicy.NonRetryableException("400 Bad Request — invalid SQL syntax");
    }
}
