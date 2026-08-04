package state;

/**
 * <h1>04 - State: The "Finite State Machine" (SDE-2+ Level)</h1>
 * 
 * <b>Scenario:</b> An E-commerce Order System. 
 * An order behaves differently based on its state:
 * - <b>New:</b> Can 'Pay' or 'Cancel'.
 * - <b>Paid:</b> Can 'Ship'. Cannot 'Pay' again.
 * - <b>Shipped:</b> Final state. No more actions.
 * 
 * <b>Senior SDE-2 Insights:</b>
 * 1. <b>FSM Logic:</b> Instead of a 500-line <code>switch(status)</code>, 
 *    each state is a class. This makes the workflow extensible.
 * 2. <b>Transition Responsibility:</b> Who changes the state? 
 *    - <b>Option A:</b> The Context (Centralized control).
 *    - <b>Option B:</b> The State classes (Decentralized - used here).
 * 3. <b>Thread Safety:</b> In production, use <b>AtomicReference</b> or 
 *    <b>synchronized</b> methods to prevent race conditions during state transitions.
 * 
 * <b>Edge Cases Handled:</b>
 * - <b>Invalid Actions:</b> Throwing exceptions if an action is illegal in the current state.
 * - <b>Circular Transitions:</b> Preventing a 'Shipped' order from going back to 'New'.
 */

// --- STATE INTERFACE ---
interface OrderState {
    void pay(OrderContext order);
    void ship(OrderContext order);
}

// --- CONCRETE STATES ---
class NewState implements OrderState {
    @Override
    public void pay(OrderContext order) {
        System.out.println("Processing Payment...");
        order.setState(new PaidState());
    }
    @Override
    public void ship(OrderContext order) {
        throw new IllegalStateException("Cannot ship an unpaid order.");
    }
}

class PaidState implements OrderState {
    @Override
    public void pay(OrderContext order) {
        System.out.println("❌ Error: Order is already paid.");
    }
    @Override
    public void ship(OrderContext order) {
        System.out.println("Shipping the items...");
        order.setState(new ShippedState());
    }
}

class ShippedState implements OrderState {
    @Override public void pay(OrderContext order) { throw new IllegalStateException("Order finished."); }
    @Override public void ship(OrderContext order) { throw new IllegalStateException("Already shipped."); }
}

// --- CONTEXT ---
class OrderContext {
    private OrderState currentState;

    public OrderContext() { this.currentState = new NewState(); }

    // [PRODUCTION_ENHANCEMENT]: Thread-safe transition
    public synchronized void setState(OrderState state) {
        this.currentState = state;
    }

    public void pay() { currentState.pay(this); }
    public void ship() { currentState.ship(this); }
}

public class StatePragmaticSDE2 {
    public static void main(String[] args) {
        OrderContext order = new OrderContext();

        // [INTERVIEW_MVP]: Standard flow
        order.pay();
        order.ship();

        // [PRODUCTION_ENHANCEMENT]: Handling illegal transitions
        try {
            order.pay(); 
        } catch (Exception e) {
            System.err.println("✅ State Guard working: " + e.getMessage());
        }
    }
}
