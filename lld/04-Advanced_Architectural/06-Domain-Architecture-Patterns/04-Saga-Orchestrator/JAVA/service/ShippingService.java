package service;

public class ShippingService {
    public boolean ship(String orderId) {
        System.out.println("   [Shipping] Dispatching package for order " + orderId);
        return true;
    }
}
