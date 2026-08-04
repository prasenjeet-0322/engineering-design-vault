package component;

/**
 * <h1>Concrete Component</h1>
 * 
 * <p>A basic, base-level object that can have responsibilities added to it.
 */
public class Pizza implements FoodItem {
    @Override
    public String getDescription() {
        return "Base Pizza";
    }

    @Override
    public double getPrice() {
        // Base price
        return 200.0;
    }
}
