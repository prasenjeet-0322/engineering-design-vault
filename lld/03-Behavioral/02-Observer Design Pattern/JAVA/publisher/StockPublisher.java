package publisher;

import subscriber.StockObserver;

/**
 * <h1>StockPublisher Interface</h1>
 * Publisher interface for high-frequency stock price updates.
 */
public interface StockPublisher {
    void register(StockObserver o);
    void unregister(StockObserver o);
    void notifyObservers();
}
