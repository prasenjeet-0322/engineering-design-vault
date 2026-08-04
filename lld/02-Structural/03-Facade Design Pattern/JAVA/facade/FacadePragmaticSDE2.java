package facade;

/**
 * <h1>02 - Facade: The "API Gateway" Pattern (SDE-2+ Level)</h1>
 * 
 * <b>Scenario:</b> A Checkout process in microservices. The frontend needs to 
 * check inventory, charge money, and update shipping. Calling 3 services 
 * from the client is slow and error-prone.
 * 
 * <b>Senior SDE-2 Insights:</b>
 * 1. <b>Chatty Client Reduction:</b> One network call from client to Facade is 
 *    better than 10. The Facade orchestrates via low-latency internal network.
 * 2. <b>Loose Coupling:</b> The client doesn't know about individual service 
 *    URLs or contracts. Only the Facade knows.
 * 3. <b>Law of Demeter:</b> The client only talks to its "immediate friend" (the Facade).
 * 
 * <b>Edge Cases Handled:</b>
 * - <b>Partial Failure:</b> If payment fails, it doesn't proceed to shipping.
 * - <b>Resource Availability:</b> Checks inventory before attempting payment.
 * - <b>Complexity Hiding:</b> Hides internal retry logic and logging.
 */
class OrderProcessorFacade {
    private final InventorySvc inventory = new InventorySvc();
    private final PaymentSvc payment = new PaymentSvc();
    private final ShippingSvc shipping = new ShippingSvc();

    /**
     * [INTERVIEW_MVP]: Simple orchestration.
     */
    public void checkout(String item, double price) {
        System.out.println("Facade: Processing order for " + item);
        
        if (inventory.isAvailable(item)) {
            if (payment.pay(price)) {
                shipping.ship(item);
                
                // --- [PRODUCTION_ENHANCEMENT] (Async & Safety) ---
                triggerEmailNotification();
                System.out.println("✅ Transaction Complete.");
            } else {
                throw new RuntimeException("Payment Declined.");
            }
        } else {
            throw new RuntimeException("Item out of stock.");
        }
    }

    private void triggerEmailNotification() { /* Async call */ }
}

class InventorySvc { boolean isAvailable(String id) { return true; } }
class PaymentSvc { boolean pay(double amt) { return true; } }
class ShippingSvc { void ship(String id) { } }

public class FacadePragmaticSDE2 {
    public static void main(String[] args) {
        new OrderProcessorFacade().checkout("PS5", 499.99);
    }
}
