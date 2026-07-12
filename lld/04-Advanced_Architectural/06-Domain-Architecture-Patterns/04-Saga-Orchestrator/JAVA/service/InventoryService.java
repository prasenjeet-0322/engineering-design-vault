package service;

public class InventoryService {
    public boolean reserve(String orderId, String item) {
        if (item.equals("OUT_OF_STOCK")) {
            System.err.println("   [Inventory] ❌ Error: " + item + " is unavailable!");
            return false;
        }
        System.out.println("   [Inventory] Reserving " + item + " for order " + orderId);
        return true;
    }

    public void restock(String orderId, String item) {
        System.out.println("   🔄 [Inventory] RESTOCKING " + item + " for order " + orderId);
    }
}
