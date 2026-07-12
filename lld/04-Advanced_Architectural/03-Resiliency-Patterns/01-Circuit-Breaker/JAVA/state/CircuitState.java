package state;

public enum CircuitState {
    CLOSED,    // System is healthy, let all requests pass.
    OPEN,      // System is failing, block ALL requests immediately (fast fail).
    HALF_OPEN  // Testing if the system is back online by allowing a single request to pass.
}
