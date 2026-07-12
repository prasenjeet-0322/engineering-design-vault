import limiter.PerUserTokenBucket;
import limiter.PerUserTokenBucket.RateLimitResult;

/**
 * <h1>Rate Limiter v2 Demo</h1>
 */
public class Main {

    public static void main(String[] args) throws InterruptedException {
        System.out.println("══════════════════════════════════════════════════════");
        System.out.println("   Rate Limiter v2: Per-User Token Bucket             ");
        System.out.println("   ✓ Per-user  ✓ CAS  ✓ Retry-After headers          ");
        System.out.println("══════════════════════════════════════════════════════\n");

        // 3 tokens max, refill 1 per second
        PerUserTokenBucket limiter = new PerUserTokenBucket(3, 1);

        // ── Scenario 1: User Alice bursts 4 requests ──
        System.out.println("══ Scenario 1: Alice bursts 4 requests ══\n");
        for (int i = 1; i <= 4; i++) {
            RateLimitResult result = limiter.allowRequest("alice");
            System.out.println("Alice [req " + i + "]: " + result);
        }

        // ── Scenario 2: Bob is independent — full quota still available ──
        System.out.println("\n══ Scenario 2: Bob is unaffected by Alice's usage ══\n");
        for (int i = 1; i <= 3; i++) {
            RateLimitResult result = limiter.allowRequest("bob");
            System.out.println("Bob   [req " + i + "]: " + result);
        }

        // ── Scenario 3: Alice waits for a refill ──
        System.out.println("\n══ Scenario 3: Alice waits 2s and gets 2 tokens back ══\n");
        System.out.println("Sleeping 2000ms...");
        Thread.sleep(2000);
        for (int i = 1; i <= 3; i++) {
            RateLimitResult result = limiter.allowRequest("alice");
            System.out.println("Alice [req " + i + " after wait]: " + result);
        }

        System.out.println("\n✅ Demo complete.");
    }
}
