package decorator;

import component.FoodItem;

/**
 * <h1>The Base Decorator</h1>
 * 
 * <p>Crucial to the pattern: It MUST implement/extend the Component interface ({@link FoodItem}), 
 * and it MUST contain a reference to a Component object. 
 * 
 * <p>By aggressively delegating all work to the wrapped object, the base decorator
 * acts as a transparent wrapper. Concrete decorators then override this behavior to "decorate" it.
 */
public abstract class FoodDecorator implements FoodItem {
    
    // The wrapped component
    protected final FoodItem wrappee;

    public FoodDecorator(FoodItem wrappee) {
        this.wrappee = wrappee;
    }

    // Default behavior is to just delegate to the wrapped object
    @Override
    public String getDescription() {
        return wrappee.getDescription();
    }

    @Override
    public double getPrice() {
        return wrappee.getPrice();
    }
}
