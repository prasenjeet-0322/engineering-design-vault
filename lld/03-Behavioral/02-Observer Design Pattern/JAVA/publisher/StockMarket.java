package publisher;

import subscriber.StockObserver;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * <h1>StockMarket (SDE-2+ Thread-Safe Publisher)</h1>
 * Uses <code>CopyOnWriteArrayList</code> to prevent ConcurrentModificationException 
 * during high-frequency concurrent price updates.
 */
public class StockMarket implements StockPublisher {
    private final String ticker;
    private double price;
    
    // [PRODUCTION_ENHANCEMENT]: Thread-safe collection for concurrent subscribers
    private final List<StockObserver> observers = new CopyOnWriteArrayList<>();

    public StockMarket(String ticker, double initialPrice) {
        this.ticker = ticker;
        this.price = initialPrice;
    }

    @Override
    public void register(StockObserver o) { 
        if (!observers.contains(o)) observers.add(o); 
    }

    @Override
    public void unregister(StockObserver o) { 
        observers.remove(o); 
    }

    @Override
    public void notifyObservers() {
        for (StockObserver o : observers) {
            o.onPriceChange(ticker, price);
        }
    }

    public void updatePrice(double newPrice) {
        this.price = newPrice;
        System.out.println("[Stock Market] 📈 " + ticker + " updated to $" + price);
        notifyObservers();
    }
}
