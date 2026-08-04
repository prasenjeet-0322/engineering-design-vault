package evolution;

import java.io.Serializable;

/**
 * <h1>01 - Singleton: The "Global State" Manager (SDE-2+ Level)</h1>
 * 
 * <b>Scenario:</b> You are building a <b>GlobalConfigurationManager</b>. 
 * It loads settings from an S3 bucket or vault on startup. Re-loading this 
 * for every request would crash the system under 10k concurrent users. 
 * You need exactly ONE instance.
 * 
 * <b>Senior SDE-2 Insights:</b>
 * 1. <b>Testability Trap:</b> Manual singletons are hard to mock. In production, 
 *    use Dependency Injection (Spring @Bean) to manage the singleton lifecycle.
 * 2. <b>Double-Checked Locking:</b> Optimized for performance (no sync after init).
 * 3. <b>Volatile:</b> Prevents "Instruction Reordering" where a thread sees 
 *    a non-null but partially initialized object.
 * 
 * <b>Edge Cases Handled:</b>
 * - <b>Multi-threading:</b> Race conditions on first access.
 * - <b>Reflection:</b> Malicious code calling private constructor.
 * - <b>Serialization:</b> Creating new instances during round-trips.
 * - <b>Cloning:</b> Deep-copying the singleton object.
 */
public class PragmaticSingleton implements Serializable, Cloneable {

    private static final long serialVersionUID = 1L;

    // --- [INTERVIEW_MVP] (Atomic Reference + Thread Safety) ---
    private static volatile PragmaticSingleton instance;

    private PragmaticSingleton() {
        // --- [PRODUCTION_ENHANCEMENT] (Reflection Guard) ---
        if (instance != null) {
            throw new RuntimeException("Violation: Constructor called on Singleton.");
        }
        // Load heavy config logic here
    }

    public static PragmaticSingleton getInstance() {
        // Double-Checked Locking Pattern
        if (instance == null) { // Check 1: No locking for 99.9% of calls
            synchronized (PragmaticSingleton.class) {
                if (instance == null) { // Check 2: Confirm no other thread created it
                    instance = new PragmaticSingleton();
                }
            }
        }
        return instance;
    }

    // --- [PRODUCTION_ENHANCEMENT] (Serialization & Cloning Guards) ---
    
    /** Ensures the same instance is returned after deserialization. */
    protected Object readResolve() { return getInstance(); }

    /** Prevents the creation of a duplicate via .clone(). */
    @Override
    protected Object clone() throws CloneNotSupportedException {
        throw new CloneNotSupportedException("Singleton cannot be cloned.");
    }

    public void logStatus() {
        System.out.println("✅ Global Config active and protected.");
    }
}
