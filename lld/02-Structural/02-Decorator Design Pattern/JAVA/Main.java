import component.FoodItem;
import component.Pizza;
import component.Burger;
import decorator.ExtraCheese;
import decorator.ExtraToppings;

/**
 * <h1>Decorator Pattern Demonstration</h1>
 * 
 * <p>The client can wrap components in multiple layers of decorators dynamically 
 * at runtime. Notice how the type of the object remains `FoodItem` regardless 
 * of how many layers of decorators it has.
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("   Decorator Pattern: Dynamic Object Wrapping     ");
        System.out.println("==================================================\n");

        // 1. Order a basic Pizza
        System.out.println("--- Order 1: Basic Pizza ---");
        FoodItem pizzaOrder = new Pizza();
        System.out.println("Description : " + pizzaOrder.getDescription());
        System.out.println("Price       : Rs. " + pizzaOrder.getPrice());
        System.out.println();

        // 2. Order a Pizza with Double Extra Cheese and Toppings
        System.out.println("--- Order 2: Fully Loaded Pizza ---");
        FoodItem loadedPizza = new Pizza();
        loadedPizza = new ExtraCheese(loadedPizza);    // Layer 1
        loadedPizza = new ExtraCheese(loadedPizza);    // Layer 2 (Double Cheese!)
        loadedPizza = new ExtraToppings(loadedPizza);  // Layer 3
        
        System.out.println("Description : " + loadedPizza.getDescription());
        System.out.println("Price       : Rs. " + loadedPizza.getPrice());
        System.out.println();

        // 3. Order a Burger with Cheese
        System.out.println("--- Order 3: Cheese Burger ---");
        FoodItem burgerOrder = new Burger();
        burgerOrder = new ExtraCheese(burgerOrder);
        
        System.out.println("Description : " + burgerOrder.getDescription());
        System.out.println("Price       : Rs. " + burgerOrder.getPrice());
    }
}
