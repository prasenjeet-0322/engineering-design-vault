package evolution;

/**
 * <h1>Stage 3: Bill Pugh Singleton (⭐⭐⭐ The Gold Standard for Classes)</h1>
 * 
 * Let's be honest, Double-Checked Locking is complex and easy to mess up 
 * (forgetting `volatile` is the most common bug in enterprise code).
 * 
 * <p><b>The Solution:</b> The Initialization-on-demand holder idiom.
 * We rely entirely on the JVM's strict class-loading guarantees. 
 * The JVM guarantees that a class is only loaded ONCE, and it handles all 
 * the thread-safety locks for us transparently during class loading.
 */
public class Stage3BillPugh {

    private Stage3BillPugh() {
        System.out.println("✅ Stage3BillPugh initialized using JVM classloader guarantees.");
    }

    // Static inner class. 
    // This class is NOT loaded into memory when Stage3BillPugh is loaded!
    // It is ONLY loaded when `getInstance()` is called for the very first time.
    private static class InstanceHolder {
        // The JVM handles thread-safety for this static initialization naturally.
        private static final Stage3BillPugh INSTANCE = new Stage3BillPugh();
    }

    public static Stage3BillPugh getInstance() {
        // Triggers the loading of InstanceHolder class, creating the singleton.
        return InstanceHolder.INSTANCE;
    }
}
