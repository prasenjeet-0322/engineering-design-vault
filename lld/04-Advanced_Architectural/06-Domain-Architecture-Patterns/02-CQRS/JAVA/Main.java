import command.UpdateStockCommand;
import handler.StockCommandHandler;
import query.StockQueryService;

/**
 * <h1>CQRS (Command Query Responsibility Segregation) Demo</h1>
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("   Architecture: CQRS Design Pattern Demo         ");
        System.out.println("==================================================\n");

        StockCommandHandler writeModel = new StockCommandHandler();
        StockQueryService readModel = new StockQueryService();

        System.out.println("--- Scenario: Command Execution ---");
        UpdateStockCommand cmd1 = new UpdateStockCommand("LAPTOP-01", 10);
        writeModel.handle(cmd1);

        // Sinulating Eventual Consistency sync
        readModel.sync("LAPTOP-01", 10);

        System.out.println("\n--- Scenario: Query Execution ---");
        int count = readModel.getStock("LAPTOP-01");
        System.out.println("Current Stock from Read Model: " + count);

        System.out.println("\n--- Scenario: Invalid Command ---");
        UpdateStockCommand cmd2 = new UpdateStockCommand("LAPTOP-01", -50);
        writeModel.handle(cmd2);
    }
}
