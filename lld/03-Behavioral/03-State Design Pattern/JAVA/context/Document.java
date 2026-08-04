package context;

import state.DraftState;
import state.IDocumentState;
import state.User;

/**
 * <h1>The Context</h1>
 * 
 * <p>Holds a reference to the current State object. It delegates all 
 * state-specific behavior to that object.
 */
public class Document {
    
    private IDocumentState currentState;

    public Document() {
        // Initial state
        this.currentState = new DraftState();
    }

    /**
     * Allows the State objects to transition the Context to a new State.
     */
    public void changeState(IDocumentState newState) {
        this.currentState = newState;
    }

    // --- Delegated Methods ---
    
    public void render() {
        currentState.render();
    }

    public void publish(User currentUser) {
        currentState.publish(this, currentUser);
    }
}
