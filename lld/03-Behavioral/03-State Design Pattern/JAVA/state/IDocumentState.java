package state;

import context.Document;

/**
 * <h1>The State Interface</h1>
 * 
 * <p>Standardizes the actions that can be performed in any state.
 * Notice that some methods may throw exceptions if the action is invalid 
 * for the current state.
 */
public interface IDocumentState {
    void render();
    void publish(Document context, User currentUser);
}
