package orchestrator;

import service.InventoryService;
import service.PaymentService;
import service.ShippingService;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

/**
 * <h1>OrderSagaOrchestrator v2 — Step-Based, Idempotent, Observable</h1>
 *
 * <p>Failures in v1:
 * <ol>
 *   <li><strong>Nested if-else pyramid:</strong> The v1 implementation is an
 *       ever-deepening block. With 5+ services it becomes unreadable and
 *       brittle — you must manually ensure every compensation is called for
 *       every possible partial failure path.</li>
 *
 *   <li><strong>Compensations not idempotent:</strong> If {@code refund()}
 *       is called twice (because a retry fires after a partial rollback), the
 *       customer gets double-refunded. Every compensating action must be safe
 *       to call multiple times.</li>
 *
 *   <li><strong>No saga log / audit trace:</strong> In production you must
 *       know exactly which steps ran and which compensated. Without a log you
 *       cannot replay a partially-completed saga after a crash.</li>
 *
 *   <li><strong>Hardcoded to 3 services:</strong> Adding a 4th service
 *       (e.g. LoyaltyPoints) requires touching the orchestrator directly.</li>
 * </ol>
 *
 * <p>Fixes:
 * <ul>
 *   <li>Each step is a {@link SagaStep} record carrying both a forward
 *       action and its compensating action.</li>
 *   <li>Steps are stored in an ordered {@code List}. The orchestrator executes
 *       them in order. On failure it walks backwards through the
 *       {@code executedSteps} list calling each compensation.</li>
 *   <li>Every compensation is wrapped in a try-catch so a failing compensation
 *       does not prevent the others from running.</li>
 *   <li>An {@code auditLog} records each step outcome — replaces manual
 *       println scattered across the code.</li>
 * </ul>
 */
public class OrderSagaOrchestrator {

    // ---------------------------------------------------------------
    // Saga Step definition
    // ---------------------------------------------------------------

    record SagaStep(
        String name,
        ThrowingRunnable action,        // forward action
        Consumer<Exception> compensate  // undo action (must be idempotent)
    ) {}

    @FunctionalInterface
    interface ThrowingRunnable { void run() throws Exception; }

    // ---------------------------------------------------------------
    // Execution
    // ---------------------------------------------------------------

    public void executeOrderSaga(String orderId, String item, double price,
                                 PaymentService payment,
                                 InventoryService inventory,
                                 ShippingService shipping) {

        System.out.println("\n[Saga] ══ Starting: " + orderId + " ══");

        List<SagaStep> steps = List.of(
            new SagaStep("Payment",
                () -> {
                    boolean ok = payment.process(orderId, price);
                    if (!ok) throw new RuntimeException("Payment declined");
                },
                ex -> payment.refund(orderId, price)         // idempotent: safe to call twice
            ),
            new SagaStep("InventoryReserve",
                () -> {
                    boolean ok = inventory.reserve(orderId, item);
                    if (!ok) throw new RuntimeException("Item unavailable: " + item);
                },
                ex -> inventory.restock(orderId, item)       // idempotent
            ),
            new SagaStep("Shipping",
                () -> {
                    boolean ok = shipping.ship(orderId);
                    if (!ok) throw new RuntimeException("Shipping dispatch failed");
                },
                ex -> System.out.println("   🔄 [Shipping] Cancel shipment for " + orderId)
            )
        );

        List<SagaStep> executed = new ArrayList<>();
        List<String>   auditLog = new ArrayList<>();

        for (SagaStep step : steps) {
            try {
                step.action().run();
                executed.add(step);
                auditLog.add("✅ " + step.name());
                System.out.println("   ✅ [Saga] Step completed: " + step.name());

            } catch (Exception e) {
                auditLog.add("❌ " + step.name() + " — " + e.getMessage());
                System.out.println("   ❌ [Saga] Step FAILED: " + step.name() + " — " + e.getMessage());
                System.out.println("   🔄 [Saga] Initiating rollback...\n");

                // Walk backwards through already-executed steps and compensate
                for (int i = executed.size() - 1; i >= 0; i--) {
                    SagaStep toCompensate = executed.get(i);
                    try {
                        toCompensate.compensate().accept(e);
                        auditLog.add("   ↩️ Compensated: " + toCompensate.name());
                        System.out.println("   ↩️ [Rollback] Compensated: " + toCompensate.name());
                    } catch (Exception compEx) {
                        // A failing compensation is a serious alert — log, don't rethrow
                        System.err.println("   💥 [CRITICAL] Compensation FAILED for: "
                            + toCompensate.name() + " — " + compEx.getMessage());
                        auditLog.add("   💥 COMPENSATION FAILED: " + toCompensate.name());
                    }
                }

                printAuditLog(orderId, auditLog);
                return;
            }
        }

        System.out.println("   🏁 [Saga] All steps completed!");
        printAuditLog(orderId, auditLog);
    }

    private void printAuditLog(String orderId, List<String> log) {
        System.out.println("\n📋 [Saga Audit Log — " + orderId + "]");
        log.forEach(entry -> System.out.println("   " + entry));
        System.out.println();
    }
}
