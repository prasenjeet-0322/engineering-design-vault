import domain.aggregate.Order;
import domain.aggregate.Order.Status;
import domain.entity.OrderItem;
import domain.valueobject.Money;

/**
 * <h1>DDD v2 Demo</h1>
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("══════════════════════════════════════════════════════");
        System.out.println("   DDD v2: Rich Domain Model + Domain Events          ");
        System.out.println("   ✓ Enum status  ✓ Domain events  ✓ Cancel transition");
        System.out.println("══════════════════════════════════════════════════════\n");

        System.out.println("── Scenario 1: Happy path ──\n");
        Order order = new Order("CUST-001");
        order.addItem(new OrderItem("P1", "MacBook Pro", new Money(1999.99, "USD"), 1));
        order.addItem(new OrderItem("P2", "Magic Mouse", new Money(79.00, "USD"), 2));
        order.completeOrder();
        System.out.println("Final: " + order);

        System.out.println("\n── Domain Events Raised (would publish to Kafka) ──\n");
        order.getAndClearDomainEvents().forEach(e -> System.out.println("   📨 Event: " + e));

        System.out.println("\n── Scenario 2: Cancel an in-progress order ──\n");
        Order order2 = new Order("CUST-002");
        order2.addItem(new OrderItem("P3", "AirPods", new Money(199.00, "USD"), 1));
        order2.cancel("Customer changed their mind");
        System.out.println("Final: " + order2);

        System.out.println("\n── Scenario 3: Invariant enforcement (compile-time enum safety) ──\n");
        try {
            order.addItem(new OrderItem("P4", "Laptop Stand", new Money(50, "USD"), 1));
        } catch (IllegalStateException e) {
            System.out.println("✅ Invariant caught: " + e.getMessage());
        }

        try {
            order2.completeOrder(); // CANCELLED → cannot complete
        } catch (IllegalStateException e) {
            System.out.println("✅ Invariant caught: " + e.getMessage());
        }
    }
}
