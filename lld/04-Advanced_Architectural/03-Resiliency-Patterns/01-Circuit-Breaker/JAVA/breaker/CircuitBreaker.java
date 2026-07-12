package breaker;

import state.CircuitState;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Supplier;

/**
 * <h1>CircuitBreaker v2 — Thread-Safe, Generic, Observable</h1>
 *
 * <p>Improvements over v1:
 * <ol>
 *   <li><strong>Thread-safe state machine:</strong> All mutable fields use
 *       {@link AtomicReference} / {@link AtomicInteger} / {@link AtomicLong}
 *       so concurrent requests from multiple threads never corrupt the state.
 *       v1 used plain {@code int} and {@code long} fields — a race condition
 *       could allow multiple threads to trip the circuit simultaneously.</li>
 *
 *   <li><strong>Generic Supplier&lt;T&gt;:</strong> v1 was hardwired to
 *       {@code ExternalPaymentService}. v2 wraps ANY {@code Supplier<T>} so
 *       the same breaker logic protects DB calls, S3 operations, or any
 *       other I/O boundary.</li>
 *
 *   <li><strong>Configurable thresholds:</strong> {@code failureThreshold}
 *       and {@code resetTimeoutMs} are constructor parameters. A DB breaker
 *       might trip at 2 failures; an analytics service might tolerate 10.</li>
 *
 *   <li><strong>Event hooks:</strong> {@code onOpen}, {@code onClose},
 *       {@code onHalfOpen} callbacks allow callers to log, alert PagerDuty,
 *       or emit a Prometheus counter when the state changes.</li>
 * </ol>
 *
 * @param <T> the return type of the protected operation
 */
public class CircuitBreaker<T> {

    private final int  failureThreshold;
    private final long resetTimeoutMs;
    private final String name;

    // Atomic fields — safe under concurrent access from multiple threads
    private final AtomicReference<CircuitState> state = new AtomicReference<>(CircuitState.CLOSED);
    private final AtomicInteger  consecutiveFailures   = new AtomicInteger(0);
    private final AtomicLong     lastFailureTime        = new AtomicLong(0);

    // Optional event hooks (default = no-op)
    private Runnable onOpen     = () -> {};
    private Runnable onClose    = () -> {};
    private Runnable onHalfOpen = () -> {};

    public CircuitBreaker(String name, int failureThreshold, long resetTimeoutMs) {
        this.name             = name;
        this.failureThreshold = failureThreshold;
        this.resetTimeoutMs   = resetTimeoutMs;
    }

    // ---------------------------------------------------------------
    // Main execute method — generic
    // ---------------------------------------------------------------

    public T execute(Supplier<T> operation) {
        evaluateState();

        if (state.get() == CircuitState.OPEN) {
            throw new CircuitOpenException(
                "⛔ [" + name + "] Circuit OPEN — fast-failing request.");
        }

        try {
            T result = operation.get();
            recordSuccess();
            return result;
        } catch (Exception e) {
            recordFailure();
            throw new RuntimeException("❌ [" + name + "] Call failed: " + e.getMessage(), e);
        }
    }

    // ---------------------------------------------------------------
    // State machine transitions
    // ---------------------------------------------------------------

    private void evaluateState() {
        if (state.get() == CircuitState.OPEN) {
            long now = System.currentTimeMillis();
            if (now - lastFailureTime.get() > resetTimeoutMs) {
                // compareAndSet is atomic — only ONE thread wins the transition
                if (state.compareAndSet(CircuitState.OPEN, CircuitState.HALF_OPEN)) {
                    System.out.println("   [" + name + "] → HALF-OPEN: probing downstream.");
                    onHalfOpen.run();
                }
            }
        }
    }

    private synchronized void recordFailure() {
        int failures = consecutiveFailures.incrementAndGet();
        lastFailureTime.set(System.currentTimeMillis());
        System.out.println("   [" + name + "] Failure #" + failures + "/" + failureThreshold);

        if (failures >= failureThreshold && state.get() == CircuitState.CLOSED) {
            state.set(CircuitState.OPEN);
            System.out.println("   🔴 [" + name + "] Circuit TRIPPED → OPEN");
            onOpen.run();
        }
    }

    private void recordSuccess() {
        if (state.get() == CircuitState.HALF_OPEN) {
            state.set(CircuitState.CLOSED);
            consecutiveFailures.set(0);
            System.out.println("   🟢 [" + name + "] Recovery confirmed → CLOSED");
            onClose.run();
        } else {
            consecutiveFailures.set(0);
        }
    }

    // ---------------------------------------------------------------
    // Builder-style event hook registration
    // ---------------------------------------------------------------

    public CircuitBreaker<T> onOpen(Runnable handler)     { this.onOpen     = handler; return this; }
    public CircuitBreaker<T> onClose(Runnable handler)    { this.onClose    = handler; return this; }
    public CircuitBreaker<T> onHalfOpen(Runnable handler) { this.onHalfOpen = handler; return this; }

    public CircuitState getState() { return state.get(); }

    // ---------------------------------------------------------------
    // Custom exception for open circuit (client can catch specifically)
    // ---------------------------------------------------------------

    public static class CircuitOpenException extends RuntimeException {
        public CircuitOpenException(String msg) { super(msg); }
    }
}
