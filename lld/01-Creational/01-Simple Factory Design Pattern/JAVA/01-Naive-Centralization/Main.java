/**
 * ============================================================================
 * 🔶 STAGE 1 — Naive Centralization (First Attempt)
 * Run: javac "01-Naive-Centralization/Main.java" && java -cp "01-Naive-Centralization" Main
 * ============================================================================
 * A developer sees the duplication and centralizes creation into ONE helper.
 * But the helper is a private static method INSIDE the client class itself.
 *
 * WHAT IMPROVED:
 *   ✅ The if/else switch is in ONE place (no duplication within this file)
 *   ✅ Business code (placeOrder, processPayment) doesn't contain switch logic
 *
 * WHAT IS STILL BROKEN:
 *   ❌ getLogger() is private → OrderService and PaymentService cannot call it
 *   ❌ Other classes must copy-paste the helper to reuse it
 *   ❌ Still uses raw String → typos compile silently ("DEBG" → returns null)
 *   ❌ Returns null for unknown levels → NPE fires 3+ frames later, no context
 *   ❌ No interface-based typing — could return Object
 * ============================================================================
 */

// ── Minimal logger contract ────────────────────────────────────────────────
interface ILoggerV1 { void log(String msg); }

class DebugLoggerV1 implements ILoggerV1 {
    @Override public void log(String msg) { System.out.println("DEBUG: " + msg); }
}
class InfoLoggerV1  implements ILoggerV1 {
    @Override public void log(String msg) { System.out.println("INFO:  " + msg); }
}
class ErrorLoggerV1 implements ILoggerV1 {
    @Override public void log(String msg) { System.err.println("ERROR: " + msg); }
}

// ── The "naive" client ─────────────────────────────────────────────────────
public class Main {

    /**
     * 🔶 BETTER: One place to create loggers (no duplication within THIS class).
     * ❌ STILL BAD: private static → only this class can call it.
     *               OrderService, PaymentService cannot reuse this.
     */
    private static ILoggerV1 getLogger(String level) {
        if (level.equals("DEBUG")) return new DebugLoggerV1();
        if (level.equals("INFO"))  return new InfoLoggerV1();
        if (level.equals("ERROR")) return new ErrorLoggerV1();
        return null; // ❌ Silent null — NPE is a time bomb
    }

    public static void main(String[] args) {
        System.out.println("╔══════════════════════════════════════════════════╗");
        System.out.println("║  STAGE 1: Naive Centralization (Still Broken)    ║");
        System.out.println("╚══════════════════════════════════════════════════╝\n");

        // 🔶 Better: no switch duplicated in business code within THIS class
        ILoggerV1 debug = getLogger("DEBUG");
        ILoggerV1 info  = getLogger("INFO");
        ILoggerV1 error = getLogger("ERROR");

        debug.log("App started");
        info.log("User logged in");
        error.log("Database timeout");

        System.out.println();

        // ── PROBLEM 1: Private helper — not shareable ──────────────────────
        System.out.println("Problem 1: Other classes can't access getLogger()");
        System.out.println("  OrderService would still need its OWN copy of getLogger()");

        // ── PROBLEM 2: Silent null return ──────────────────────────────────
        System.out.println("\nProblem 2: Unknown level → null → NPE");
        ILoggerV1 unknown = getLogger("WARN"); // WARN not in switch → null
        System.out.println("  getLogger(\"WARN\") returned: " + unknown);
        try {
            unknown.log("This message"); // 💥 NPE here, not in getLogger()
        } catch (NullPointerException e) {
            System.out.println("  💥 NPE! Stack trace points HERE, not to getLogger().");
            System.out.println("     No context. Impossible to debug at scale.");
        }

        // ── PROBLEM 3: Typo silently returns null ──────────────────────────
        System.out.println("\nProblem 3: String typo compiles fine → silent null");
        ILoggerV1 typo = getLogger("DEBG"); // typo — compiles! returns null
        System.out.println("  getLogger(\"DEBG\") returned: " + typo);

        System.out.println();
        System.out.println("→ NEXT: Extract getLogger() to a dedicated LoggerFactory class");
        System.out.println("        Use enum instead of String. Throw, never return null.");
    }
}
