package decorator;

import component.FoodItem;

/**
 * <h1>Concrete Decorator</h1>
 * 
 * <p>Adds extra cheese state/behavior to the wrapped object.
 */
public class ExtraCheese extends FoodDecorator {
    private final double cheesePrice = 20.0;

    public ExtraCheese(FoodItem wrappee) {
        super(wrappee);
    }

    @Override
    public String getDescription() {
        // Decorates the base description
        return wrappee.getDescription() + " + Extra Cheese";
    }

    @Override
    public double getPrice() {
        // Decorates the base price
        return wrappee.getPrice() + cheesePrice;
    }
}
