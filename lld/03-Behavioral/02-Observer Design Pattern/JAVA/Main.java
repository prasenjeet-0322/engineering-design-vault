import publisher.OnlineStore;
import publisher.StockMarket;
import subscriber.EmailService;
import subscriber.LogisticsDepartment;
import subscriber.MobileApp;
import subscriber.StockObserver;

/**
 * <h1>Observer Pattern Master Demo</h1>
 * 
 * Demonstrates 2 Scenarios:
 * 1. E-Commerce Order Notification System (Classic Pub/Sub).
 * 2. High-Frequency Stock Ticker (SDE-2 Thread-Safe CopyOnWriteArrayList Pub/Sub).
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("   Observer Pattern: Comprehensive Java Master Demo");
        System.out.println("==================================================\n");

        // --- DEMO 1: E-COMMERCE ORDER NOTIFICATION SYSTEM ---
        System.out.println("=== 🛒 DEMO 1: E-Commerce Order Notification System ===");
        OnlineStore store = new OnlineStore("ORD-999X");

        EmailService emailSub = new EmailService("alice@example.com");
        MobileApp pushSub = new MobileApp("Device_iPhone_14");
        LogisticsDepartment warehouseSub = new LogisticsDepartment();

        store.subscribe(emailSub);
        store.subscribe(pushSub);
        store.subscribe(warehouseSub);

        System.out.println("--- Scenario 1.1: Payment Cleared ---");
        store.setStatus("PAYMENT_SUCCESS");

        System.out.println("\n--- Scenario 1.2: User unsubscribes from Push Notifications ---");
        store.unsubscribe(pushSub);
        
        System.out.println("\n--- Scenario 1.3: Order Shipped ---");
        store.setStatus("SHIPPED");

        // --- DEMO 2: REAL-TIME STOCK TICKER (SDE-2 CONCURRENCY SAFE) ---
        System.out.println("\n==================================================");
        System.out.println("=== 📈 DEMO 2: SDE-2 Pragmatic Stock Market Ticker ===");
        System.out.println("==================================================");

        StockMarket appleStock = new StockMarket("AAPL", 150.0);

        // Dynamic Lambdas as Observers
        StockObserver mobileTrader = (ticker, price) -> 
            System.out.println("   [📱 Mobile Alert] " + ticker + " target price reached: $" + price);

        StockObserver algorithmicTrader = (ticker, price) -> 
            System.out.println("   [🤖 Algo Trader] Automated BUY order executed for " + ticker + " at $" + price);

        appleStock.register(mobileTrader);
        appleStock.register(algorithmicTrader);

        appleStock.updatePrice(155.50);
        appleStock.updatePrice(160.00);

        System.out.println("\n✅ All Observer Pattern Demos Executed Successfully!");
    }
}
