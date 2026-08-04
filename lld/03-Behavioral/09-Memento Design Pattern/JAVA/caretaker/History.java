package caretaker;

import memento.DocumentMemento;
import java.util.Stack;

/**
 * <h1>The Caretaker</h1>
 * 
 * <p>Responsible for keeping the Mementos safe. 
 * Notice it NEVER inspects or alters the Memento's data! It just stores them in a Stack.
 */
public class History {
    
    private final Stack<DocumentMemento> historyStack = new Stack<>();

    public void push(DocumentMemento memento) {
        historyStack.push(memento);
    }

    public DocumentMemento pop() {
        if (historyStack.isEmpty()) {
            return null;
        }
        return historyStack.pop();
    }
}
