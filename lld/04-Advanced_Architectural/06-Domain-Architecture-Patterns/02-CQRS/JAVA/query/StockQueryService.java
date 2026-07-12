package query;

import handler.StockCommandHandler;
import java.util.HashMap;
import java.util.Map;

/**
 * <h1>The Query Service (Read Model)</h1>
 * 
 * <p>Responsible for fetching data in a highly optimized way. 
 * In a real-world scenario, this might read from a read-replica 
 * or an ElasticSearch index.
 */
public class StockQueryService {
    
    // Simulating a highly optimized read model (e.g., a View or a Cache)
    private final Map<String, Integer> readStore = new HashMap<>();

    public int getStock(String productId) {
        System.out.println("   [Read Model] Fetching current stock for: " + productId);
        return readStore.getOrDefault(productId, 0);
    }

    /**
     * In a true CQRS system, the Read Model is updated asynchronously via Domain Events.
     */
    public void sync(String productId, int newQuantity) {
        readStore.put(productId, newQuantity);
    }
}
