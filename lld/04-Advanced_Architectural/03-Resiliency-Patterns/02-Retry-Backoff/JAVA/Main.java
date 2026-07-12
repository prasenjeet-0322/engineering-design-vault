import retry.RetryPolicy;
import service.DatabaseService;

/**
 * <h1>Retry Backoff v2 Demo</h1>
 */
public class Main {

    public static void main(String[] args) {
        System.out.println("══════════════════════════════════════════════════════");
        System.out.println("   Retry Backoff v2: Jitter, Caps, Selective Demo     ");
        System.out.println("   ✓ Full Jitter  ✓ Max cap  ✓ Typed exceptions       ");
        System.out.println("══════════════════════════════════════════════════════\n");

        // 5 retries, start at 300ms, cap at 4 seconds
        RetryPolicy<String> policy = new RetryPolicy<>(5, 300, 4000);
        DatabaseService db = new DatabaseService();

        // ----------------------------------------------------------------
        // SCENARIO 1: Transient failures → retried → succeeds
        // ----------------------------------------------------------------
        System.out.println("══ Scenario 1: Retryable (transient) failure ══\n");
        try {
            String result = policy.execute(db::executeQuery);
            System.out.println("\n✅ Final result: " + result);
        } catch (Exception e) {
            System.out.println("💥 " + e.getMessage());
        }

        // ----------------------------------------------------------------
        // SCENARIO 2: Non-retryable (permanent) failure → aborts instantly
        // ----------------------------------------------------------------
        System.out.println("\n══ Scenario 2: Non-retryable (permanent) failure ══\n");
        try {
            policy.execute(db::executeBadQuery);
        } catch (Exception e) {
            System.out.println("💥 Caught (no retries wasted): " + e.getMessage());
        }

        System.out.println("\n✅ Demo complete.");
    }
}
