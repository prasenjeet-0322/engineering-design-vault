package component;

/**
 * <h1>The Component Interface</h1>
 * 
 * <p>The lowest common denominator. Both our base concrete items (Pizza/Burger) 
 * and our decorators will implement this interface. This enables the recursive
 * wrapping behavior at the heart of the Decorator pattern.
 */
public interface FoodItem {
    String getDescription();
    double getPrice();
}
