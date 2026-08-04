package evolution;

/**
 * <h1>Stage 2: Double-Checked Locking (✅ The Interview Classic)</h1>
 * 
 * This solves the extreme performance bottleneck of Stage 1b by only synchronizing 
 * the ACTUAL creation of the object. Once the object is created, the lock is completely bypassed.
 * 
 * <p><b>CRITICAL DETAIL:</b> The `volatile` keyword is mandatory here. 
 * Without `volatile`, the Java compiler/CPU can reorder instructions resulting in 
 * Thread B seeing a non-null instance variable BEFORE the object's constructor has 
 * actually finished running (partially constructed object leak).
 */
public class Stage2DoubleChecked {

    // 1. MUST BE VOLATILE to prevent instruction reordering
    private static volatile Stage2DoubleChecked instance;

    private Stage2DoubleChecked() {
        System.out.println("✅ Stage2DoubleChecked initialized safely and performantly.");
    }

    public static Stage2DoubleChecked getInstance() {
        
        // 1st Check: Fast-path (no locks). If already created, return immediately.
        if (instance == null) {
            
            // Only lock if we actually need to create the object
            synchronized (Stage2DoubleChecked.class) {
                
                // 2nd Check: Once inside the lock, check again to ensure another
                // thread didn't create it while we were waiting to acquire the lock.
                if (instance == null) {
                    instance = new Stage2DoubleChecked();
                }
            }
        }
        return instance;
    }
}
