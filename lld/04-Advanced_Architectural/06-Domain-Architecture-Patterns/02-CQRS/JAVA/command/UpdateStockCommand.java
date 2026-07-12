package command;

public class UpdateStockCommand extends BaseCommand {
    private final String productId;
    private final int quantityChange;

    public UpdateStockCommand(String productId, int quantityChange) {
        this.productId = productId;
        this.quantityChange = quantityChange;
    }

    public String getProductId() { return productId; }
    public int getQuantityChange() { return quantityChange; }
}
