package component;

/**
 * <h1>Concrete Component</h1>
 */
public class Burger implements FoodItem {
    @Override
    public String getDescription() {
        return "Classic Burger";
    }

    @Override
    public double getPrice() {
        // Base price
        return 100.0;
    }
}
