package subscriber;

/**
 * <h1>StockObserver Interface</h1>
 * Subscriber interface for listening to stock ticker updates.
 */
public interface StockObserver {
    void onPriceChange(String ticker, double newPrice);
}
