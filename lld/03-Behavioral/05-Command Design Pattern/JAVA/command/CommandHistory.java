package command;

import java.util.Stack;

/**
 * <h1>The Invoker</h1>
 * 
 * <p>Doesn't know anything about TextEditors or insertion algorithms.
 * It just holds a list of ICommand interfaces and triggers their methods.
 * This specific invoker acts as a Command History (Undo Stack).
 */
public class CommandHistory {
    private final Stack<ICommand> history = new Stack<>();

    public void executeCommand(ICommand cmd) {
        cmd.execute();
        history.push(cmd); // Save state for potential undo
    }

    public void undoLastCommand() {
        if (history.isEmpty()) {
            System.out.println("   [History] Nothing to undo.");
            return;
        }

        ICommand lastCmd = history.pop();
        System.out.println("   [History] ⏪ Undoing last action...");
        lastCmd.undo();
    }
}
