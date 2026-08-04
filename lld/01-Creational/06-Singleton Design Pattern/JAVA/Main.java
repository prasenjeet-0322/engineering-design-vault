import evolution.*;

/**
 * <h1>The Singleton Tester</h1>
 * Run this multiple times to see different behaviors.
 * 
 * Notice that Stage 1a (Naive) will occasionally print its initialization 
 * message multiple times.
 * 
 * Stages 1b, 2, 3, and 4 will ALWAYS only print their initialization message once.
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("--- Booting Singleton Multi-Threading Test ---");

        // We launch 10 threads virtually simultaneously
        for (int i = 0; i < 10; i++) {
            new Thread(() -> {
                testSingletons();
            }).start();
        }
    }

    private static void testSingletons() {
        // --- STAGE 1a: NAIVE LAZY INIT ---
        // Expectation: Sometimes you will see multiple "❌ Stage1NaiveLazy initialized!" logs.
        Stage1NaiveLazy naiveInstance = Stage1NaiveLazy.getInstance();

        // --- STAGE 1b: SYNCHRONIZED METHOD ---
        // Expectation: Will never double-init, but is extremely slow at scale.
        Stage1bSynchronizedMethod syncInstance = Stage1bSynchronizedMethod.getInstance();

        // --- STAGE 2: DOUBLE-CHECKED LOCKING ---
        // Expectation: Will never double-init, performant.
        Stage2DoubleChecked doubleCheckedInstance = Stage2DoubleChecked.getInstance();

        // --- STAGE 3: BILL PUGH ---
        // Expectation: The cleanest regular class singleton.
        Stage3BillPugh billPughInstance = Stage3BillPugh.getInstance();

        // --- STAGE 4: ENUM SINGLETON ---
        // Expectation: The most robust singleton.
        Stage4EnumSingleton enumInstance = Stage4EnumSingleton.INSTANCE;
    }
}
