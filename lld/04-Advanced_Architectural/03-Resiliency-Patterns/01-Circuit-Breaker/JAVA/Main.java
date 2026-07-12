import breaker.CircuitBreaker;
import service.ExternalPaymentService;

/**
 * <h1>Circuit Breaker v2 Demo</h1>
 */
public class Main {

    public static void main(String[] args) throws InterruptedException {
        System.out.println("══════════════════════════════════════════════════════");
        System.out.println("   Circuit Breaker v2: Thread-Safe & Generic Demo     ");
        System.out.println("   ✓ Atomic state  ✓ Generic  ✓ Configurable  ✓ Hooks ");
        System.out.println("══════════════════════════════════════════════════════\n");

        ExternalPaymentService stripeApi = new ExternalPaymentService();

        // Generic breaker wrapping String return type
        // Trip at 3 failures, reset after 5 seconds
        CircuitBreaker<String> breaker = new CircuitBreaker<String>("stripe-api", 3, 5000)
            .onOpen(()     -> System.out.println("   🚨 [Alert] PagerDuty: stripe-api circuit OPENED!"))
            .onClose(()    -> System.out.println("   ✅ [Alert] PagerDuty: stripe-api RECOVERED"))
            .onHalfOpen(() -> System.out.println("   🔍 [Alert] stripe-api entering probe mode"));

        System.out.println("── Scenario 1: Healthy calls ──\n");
        execute(breaker, stripeApi);
        execute(breaker, stripeApi);

        System.out.println("\n── Scenario 2: Service crashes ──\n");
        stripeApi.simulateServerCrash();
        for (int i = 0; i < 5; i++) execute(breaker, stripeApi);

        System.out.println("\n── Scenario 3: Fast-failing (Open circuit) ──\n");
        execute(breaker, stripeApi);
        execute(breaker, stripeApi);

        System.out.println("\n── Scenario 4: Recovery after 6s cooldown ──\n");
        System.out.println("Sleeping 6 seconds...");
        Thread.sleep(6000);
        stripeApi.simulateServerRecovery();
        execute(breaker, stripeApi);  // HALF-OPEN probe
        execute(breaker, stripeApi);  // CLOSED — fully recovered

        System.out.println("\n✅ Demo complete. Final state: " + breaker.getState());
    }

    private static void execute(CircuitBreaker<String> breaker, ExternalPaymentService api) {
        try {
            String result = breaker.execute(api::processPayment);
            System.out.println("   Result: " + result);
        } catch (CircuitBreaker.CircuitOpenException e) {
            System.out.println("   " + e.getMessage());
        } catch (Exception e) {
            System.out.println("   Call failed: " + e.getMessage());
        }
    }
}
