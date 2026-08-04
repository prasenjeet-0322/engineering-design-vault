import logger.*;

/**
 * ============================================================================
 * ✅ STAGE 2 — Clean Client: Main.java
 * ============================================================================
 * Run: javac -d out logger/*.java Main.java && java -cp out Main
 *
 * WHO IS THE CLIENT HERE?
 *   THIS class (Main) is the client. It:
 *     - Asks the factory for a logger   → LoggerFactory.createLogger(level)
 *     - Receives an ILogger abstraction → calls log()
 *     - Has ZERO knowledge of which concrete class was returned
 *
 * WHAT THE CLIENT IMPORTS (look at the import above):
 *   ✅ import logger.*; — covers ILogger, LogLevel, LoggerFactory
 *   ❌ NOT imported: DebugLogger, InfoLogger, WarnLogger, ErrorLogger, TraceLogger
 *
 * THE CHANGE PROOF:
 *   Adding a new environment "canary" with WarnLogger?
 *   → Open LoggerFactory.java. Add one entry to the EnumMap. Done.
 *   → This file: ZERO changes.
 * ============================================================================
 */
public class Main {
    public static void main(String[] args) {

        System.out.println("╔══════════════════════════════════════════════════════╗");
        System.out.println("║  STAGE 2: Simple Factory — Client is a PURE USER     ║");
        System.out.println("╚══════════════════════════════════════════════════════╝\n");

        // ── The client asks. The factory decides. The client receives ILogger. ──
        System.out.println("── Client asks factory (env → logger) ───────────────");
        ILogger devLogger    = LoggerFactory.createLogger(LogLevel.DEBUG);  // "dev"
        ILogger prodLogger   = LoggerFactory.createLogger(LogLevel.ERROR);  // "prod"
        ILogger stageLogger  = LoggerFactory.createLogger(LogLevel.INFO);   // "stage"
        ILogger canaryLogger = LoggerFactory.createLogger(LogLevel.WARN);   // "canary" ← added in 1 line in LoggerFactory
        ILogger traceLogger  = LoggerFactory.createLogger(LogLevel.TRACE);

        devLogger.log("OrderService: placeOrder() entered");
        prodLogger.log("PaymentService: charge failed for CUST-001");
        stageLogger.log("ShippingService: order shipped ORD-001");
        canaryLogger.log("ReportingService: canary traffic received ← was broken in Stage 0!");
        traceLogger.log("UserService: entering findById()");

        System.out.println();

        // ── Proof 1: The client has no idea which concrete class it holds ─────
        System.out.println("── Client proof: no concrete class knowledge ─────────");
        for (ILogger logger : new ILogger[]{devLogger, prodLogger, stageLogger, canaryLogger}) {
            // Client only knows: it has an ILogger. It calls log(). That's it.
            System.out.println("  Logger level=" + logger.getLevel() +
                               " | type=" + logger.getClass().getSimpleName());
            // ↑ Even getClass().getSimpleName() requires reflection — normal code never does this
        }

        System.out.println();

        // ── Proof 2: Caching — same level = same instance (no new objects) ───
        System.out.println("── Caching proof (stateless loggers are reused) ──────");
        ILogger debug1 = LoggerFactory.createLogger(LogLevel.DEBUG);
        ILogger debug2 = LoggerFactory.createLogger(LogLevel.DEBUG);
        System.out.println("  Same instance? debug1 == debug2: " + (debug1 == debug2));  // true

        System.out.println();

        // ── Proof 3: Fail-fast — unknown input throws immediately ─────────────
        System.out.println("── Fail-fast proof (no silent null) ─────────────────");
        try {
            LoggerFactory.createLogger(null); // null input → immediate loud failure
        } catch (Exception e) {
            System.out.println("  Caught: " + e.getClass().getSimpleName() + ": " + e.getMessage());
            System.out.println("  Fails HERE, not 10 frames later. No silent null.");
        }
    }
}
