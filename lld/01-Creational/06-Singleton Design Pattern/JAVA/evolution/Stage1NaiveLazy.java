package evolution;

/**
 * <h1>Stage 1a: Naive Lazy Initialization (❌ Thread Unsafe)</h1>
 * 
 * This is the most basic implementation of a Singleton.
 * It delays creation of the instance until it is actually needed (Lazy Init).
 * 
 * <p>
 * <b>The Flaw:</b> In a multi-threaded environment, if Thread A and Thread B
 * both evaluate `instance == null` at the exact same time, they will BOTH
 * create a new instance of the PaymentGateway. The Singleton guarantee is
 * broken.
 */
public class Stage1NaiveLazy {

    // 1. Private static variable to hold the single instance
    private static Stage1NaiveLazy instance;

    // 2. Private constructor prevents direct instantiation
    private Stage1NaiveLazy() {
        System.out.println("❌ Stage1NaiveLazy initialized! (If you see this twice, Singleton broke)");
    }

    // 3. Public static method to get the instance
    public static Stage1NaiveLazy getInstance() {
        if (instance == null) {

            // Simulating a slight delay to forcefully expose the race condition
            try {
                Thread.sleep(50);
            } catch (InterruptedException e) {
            }

            instance = new Stage1NaiveLazy();
        }
        return instance;
    }

    public void processPayment(double amount) {
        System.out.println("Processing $" + amount);
    }
}
