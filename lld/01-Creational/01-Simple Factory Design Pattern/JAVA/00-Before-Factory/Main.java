/**
 * ============================================================================
 * ❌ STAGE 0 — The Real Problem: Env-Based Logger Selection Scattered Everywhere
 * ============================================================================
 * Run: javac "00-Before-Factory/Main.java" && java -cp "00-Before-Factory" Main
 *
 * WHO ARE THE CLIENTS HERE?
 *   OrderService, PaymentService, ShippingService = the CLIENTS.
 *   But before the factory, clients are ALSO mini-factories — they both
 *   CREATE loggers AND USE them. Two responsibilities in one class. SRP broken.
 *
 * THE 3-LAYER PROBLEM (from the README story):
 *   Problem 1: KNOWLEDGE DUPLICATION — The "env → logger" mapping lives in 15 files.
 *   Problem 2: NO COMPILER SAFETY — A missing 'if' branch is valid Java. Pure silence.
 *   Problem 3: WRONG RESPONSIBILITY — OrderService should know about orders, not LogLevel.
 * ============================================================================
 */

// ── Logger types (in real code, each would be in its own file) ────────────

interface ILoggerV0 { void log(String msg); }

class DebugLoggerV0 implements ILoggerV0 {
    @Override public void log(String msg) { System.out.println("  [DEBUG] " + msg); }
}
class InfoLoggerV0  implements ILoggerV0 {
    @Override public void log(String msg) { System.out.println("  [INFO ] " + msg); }
}
class ErrorLoggerV0 implements ILoggerV0 {
    @Override public void log(String msg) { System.out.println("  [ERROR] " + msg); }
}
// Day 45: WarnLoggerV0 is ready. But where else must we add it? Keep reading.
class WarnLoggerV0  implements ILoggerV0 {
    @Override public void log(String msg) { System.out.println("  [WARN ] " + msg); }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT 1: OrderService
//
// ROLE: Client (uses the logger).
// PROBLEM: Also acts as a mini-factory (creates the logger itself).
//          This class knows about orders AND about which logger class to use in
//          which environment. That's two reasons to change. SRP violated.
// ─────────────────────────────────────────────────────────────────────────────
class OrderService {
    private final String env; // comes from config: "dev", "prod", "stage", "canary"

    public OrderService(String env) { this.env = env; }

    public void placeOrder(String orderId) {
        // ❌ Problem 1 (Duplication): This exact switch exists in PaymentService,
        //    ShippingService, UserService... 15 files total.
        // ❌ Problem 3 (Wrong Responsibility): OrderService now knows that
        //    "in dev we use DebugLogger". That's infrastructure logic in domain code.
        ILoggerV0 logger;
        if      (env.equals("dev"))   logger = new DebugLoggerV0();
        else if (env.equals("prod"))  logger = new ErrorLoggerV0();
        else if (env.equals("stage")) logger = new InfoLoggerV0();
        // ❌ Problem 2 (No Safety): "canary" is NOT handled here.
        //    Java won't warn you. The logger stays null. Business logic runs silently.
        else logger = null;

        if (logger != null) logger.log("Order placed: " + orderId);
        System.out.println("  [OrderService] Business logic ran for: " + orderId);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT 2: PaymentService
//
// ROLE: Client (uses the logger).
// PROBLEM: Contains the EXACT SAME if/else as OrderService — just copy-pasted.
//          This is the duplication that kills teams on Day 45.
// ─────────────────────────────────────────────────────────────────────────────
class PaymentService {
    private final String env;

    public PaymentService(String env) { this.env = env; }

    public void processPayment(String customerId, double amount) {
        // ❌ EXACT DUPLICATE of OrderService's if/else.
        // Adding "canary" here fixes PaymentService logging.
        // But did you remember to fix OrderService? ShippingService? ReportingService?
        ILoggerV0 logger;
        if      (env.equals("dev"))   logger = new DebugLoggerV0();
        else if (env.equals("prod"))  logger = new ErrorLoggerV0();
        else if (env.equals("stage")) logger = new InfoLoggerV0();
        // canary → null (forgot to add it here too!)
        else logger = null;

        if (logger != null) logger.log("Charged $" + amount + " for: " + customerId);
        System.out.println("  [PaymentService] Business logic: charged $" + amount);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT 3: ShippingService (simulating the "forgot" service on Day 46)
//
// ROLE: Client — but the one you missed when "canary" was added.
// This is ReportingService from the README story.
// ─────────────────────────────────────────────────────────────────────────────
class ShippingService {
    private final String env;

    public ShippingService(String env) { this.env = env; }

    public void shipOrder(String orderId) {
        ILoggerV0 logger;
        if      (env.equals("dev"))   logger = new DebugLoggerV0();
        else if (env.equals("prod"))  logger = new ErrorLoggerV0();
        else if (env.equals("stage")) logger = new InfoLoggerV0();
        // ❌ canary: NOT added here. The developer forgot this file.
        //    No compile error. No test fails. logger = null.
        else logger = null;

        // ❌ Problem 2: logger is null for "canary". This if-guard hides the bug.
        //    Business logic runs perfectly. Logs are completely absent.
        if (logger != null) logger.log("Shipped order: " + orderId);
        System.out.println("  [ShippingService] Business logic: shipped " + orderId);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// RUNNER — Demonstrates all 3 problems
// ─────────────────────────────────────────────────────────────────────────────
public class Main {
    public static void main(String[] args) {

        System.out.println("╔══════════════════════════════════════════════════════╗");
        System.out.println("║  STAGE 0: No Factory — Clients Are Mini-Factories    ║");
        System.out.println("╚══════════════════════════════════════════════════════╝\n");

        // ── Normal environments work fine ─────────────────────────────────
        System.out.println("── Known environments (dev/prod/stage) ──────────────");
        new OrderService("dev").placeOrder("ORD-001");
        new PaymentService("prod").processPayment("CUST-001", 1299.99);
        new ShippingService("stage").shipOrder("ORD-001");

        System.out.println();

        // ── Problem 2: Canary deployment — silent failure demo ────────────
        System.out.println("── Canary environment (added to OrderService, forgot ShippingService) ──");
        // OrderService: developer remembered to add canary on Day 45
        // (simulated by manually returning WarnLogger here)
        System.out.println("  OrderService on canary:   logs fine (developer remembered)");
        System.out.println("  [WARN ] Order placed: ORD-002   ← this would appear if added");

        System.out.println();

        // ShippingService: developer FORGOT (logger = null)
        System.out.println("  ShippingService on canary: SILENT FAILURE ↓");
        new ShippingService("canary").shipOrder("ORD-002");
        // Output: only "[ShippingService] Business logic ran" — no log line at all!
        System.out.println("  ↑ No [WARN] line above. Logger was null. Bug is invisible.");
        System.out.println("  ↑ No exception. No alert. No test failure.");
        System.out.println("  ↑ This ran in production for 18 hours before anyone noticed.");

        System.out.println();

        // ── Change impact summary ─────────────────────────────────────────
        System.out.println("── Adding 'canary' meant touching: ──────────────────");
        System.out.println("  ✅ OrderService.java        (remembered)");
        System.out.println("  ✅ PaymentService.java      (remembered)");
        System.out.println("  ❌ ShippingService.java     (FORGOTTEN → silent null)");
        System.out.println("  ❌ ReportingService.java    (FORGOTTEN → silent null)");
        System.out.println("  ❌ NotificationService.java (FORGOTTEN → silent null)");
        System.out.println();
        System.out.println("  With Simple Factory: change 1 line in 1 file. Done.");
        System.out.println();
        System.out.println("→ Next: see 01-Naive-Centralization/Main.java");
    }
}
