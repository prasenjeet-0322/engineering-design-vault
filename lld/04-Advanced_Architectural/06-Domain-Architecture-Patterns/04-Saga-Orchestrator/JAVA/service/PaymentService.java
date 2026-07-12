package service;

public class PaymentService {
    public boolean process(String orderId, double amount) {
        System.out.println("   [Payment] Deducting $" + amount + " for order " + orderId);
        return true; // Simulate success
    }

    public void refund(String orderId, double amount) {
        System.out.println("   🔄 [Payment] REFUNDING $" + amount + " for order " + orderId);
    }
}
