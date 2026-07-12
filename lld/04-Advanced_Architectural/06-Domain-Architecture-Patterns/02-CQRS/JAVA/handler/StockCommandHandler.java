package handler;

import command.UpdateStockCommand;
import java.util.HashMap;
import java.util.Map;

/**
 * <h1>The Command Handler (Write Model)</h1>
 * 
 * <p>Responsible for validating and executing commands 
 * that change the state of the system.
 */
public class StockCommandHandler {
    // In-memory data store for simplicity
    private final Map<String, Integer> stockContainer = new HashMap<>();

    public void handle(UpdateStockCommand command) {
        System.out.println("   [Write Model] Executing Command: " + command.getId());
        
        int currentStock = stockContainer.getOrDefault(command.getProductId(), 0);
        int newStock = currentStock + command.getQuantityChange();

        if (newStock < 0) {
            System.err.println("   ❌ Error: Stock cannot be negative for " + command.getProductId());
            return;
        }

        stockContainer.put(command.getProductId(), newStock);
        System.out.println("   ✅ [Write Model] Updated " + command.getProductId() + " to " + newStock);
    }
}
