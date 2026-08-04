package decorator;

import component.FoodItem;

/**
 * <h1>Concrete Decorator</h1>
 */
public class ExtraToppings extends FoodDecorator {
    private final double toppingsPrice = 45.0;

    public ExtraToppings(FoodItem wrappee) {
        super(wrappee);
    }

    @Override
    public String getDescription() {
        return wrappee.getDescription() + " + Extra Veg Toppings";
    }

    @Override
    public double getPrice() {
        return wrappee.getPrice() + toppingsPrice;
    }
}
