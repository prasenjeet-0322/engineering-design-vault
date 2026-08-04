package evolution;

/**
 * <h1>Stage 1b: Synchronized Method (❌ Terrible Performance)</h1>
 * 
 * To fix the race condition in Stage 1a, junior developers often just 
 * slap the `synchronized` keyword on the `getInstance()` method.
 * 
 * <p><b>The Flaw:</b> While this makes it 100% thread-safe, it creates a massive 
 * performance bottleneck. Every single thread that wants to get the instance 
 * must wait in line to acquire the lock, even AFTER the instance has been safely created.
 * Read operations should not be locked!
 */
public class Stage1bSynchronizedMethod {

    private static Stage1bSynchronizedMethod instance;

    private Stage1bSynchronizedMethod() {
        System.out.println("✅ Stage1bSynchronizedMethod initialized safely.");
    }

    // The lock is acquired on the entire method. Slow!
    public static synchronized Stage1bSynchronizedMethod getInstance() {
        if (instance == null) {
            try { Thread.sleep(50); } catch (InterruptedException e) {}
            instance = new Stage1bSynchronizedMethod();
        }
        return instance;
    }
}
