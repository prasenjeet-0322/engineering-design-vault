package evolution;

/**
 * <h1>Stage 4: Enum Singleton (⭐⭐⭐⭐⭐ The Unhackable Solution)</h1>
 * 
 * Both Stage 2 and Stage 3 can be HACKED via Java Reflection (`Constructor.setAccessible(true)`) 
 * or via Serialization (deserializing creates a new copy of the object).
 * 
 * <p><b>The Solution:</b> Joshua Bloch (author of Effective Java) states that a single-element 
 * Enum is the absolute best way to implement a Singleton in Java. 
 * The JVM strictly guarantees that Enums are instantiated exactly once, and inherently protects 
 * them from both Reflection attacks and Serialization duplication.
 */
public enum Stage4EnumSingleton {
    
    // The single instance
    INSTANCE;

    // Optional: Add state
    private String gatewayName;

    // Enums can have private constructors naturally
    private Stage4EnumSingleton() {
        this.gatewayName = "Stripe";
        System.out.println("✅ Stage4EnumSingleton initialized. Unhackable via reflection/serialization.");
    }

    // Standard business methods
    public void processPayment(double amount) {
        System.out.println("Processing $" + amount + " via Enum Singleton (" + gatewayName + ")");
    }
}
