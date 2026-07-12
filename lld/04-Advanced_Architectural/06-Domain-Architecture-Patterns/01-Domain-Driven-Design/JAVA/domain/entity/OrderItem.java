package domain.entity;

import domain.valueobject.Money;

/**
 * <h1>The Entity</h1>
 * 
 * <p>Identified by a unique ID. Its attributes can change, 
 * but its identity remains constant.
 */
public class OrderItem {
    private final String productId;
    private final String productName;
    private final Money price;
    private int quantity;

    public OrderItem(String productId, String productName, Money price, int quantity) {
        this.productId = productId;
        this.productName = productName;
        this.price = price;
        this.quantity = quantity;
    }

    public String getProductId() { return productId; }
    public Money getPrice() { return price; }
    public int getQuantity() { return quantity; }

    public Money getTotalPrice() {
        return new Money(price.getAmount() * quantity, price.getCurrency());
    }

    @Override
    public String toString() {
        return productName + " (x" + quantity + ") - " + getTotalPrice();
    }
}
