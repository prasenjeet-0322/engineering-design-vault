import orchestrator.OrderSagaOrchestrator;
import service.InventoryService;
import service.PaymentService;
import service.ShippingService;

/**
 * <h1>Saga Orchestrator v2 Demo</h1>
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("══════════════════════════════════════════════════════");
        System.out.println("   Saga Orchestrator v2: Step-Based + Audit Log       ");
        System.out.println("   ✓ Steps  ✓ Reverse rollback  ✓ Idempotent  ✓ Log   ");
        System.out.println("══════════════════════════════════════════════════════");

        PaymentService    payment   = new PaymentService();
        InventoryService  inventory = new InventoryService();
        ShippingService   shipping  = new ShippingService();

        OrderSagaOrchestrator orchestrator = new OrderSagaOrchestrator();

        // ── Happy Path ──
        orchestrator.executeOrderSaga("ORD-001", "Smartphone", 999.0,
                                      payment, inventory, shipping);

        // ── Inventory Failure → Payment Compensated ──
        orchestrator.executeOrderSaga("ORD-002", "OUT_OF_STOCK", 49.0,
                                      payment, inventory, shipping);
    }
}
