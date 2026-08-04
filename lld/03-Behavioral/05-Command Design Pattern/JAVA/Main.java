import command.CommandHistory;
import command.ICommand;
import command.InsertTextCommand;
import receiver.TextEditor;

/**
 * <h1>Command Pattern Demonstration</h1>
 * 
 * <p>Demonstrates how encapsulating method calls into Command objects 
 * enables complex features like Undo (Ctrl+Z) functionality.
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("   Command Pattern: Text Editor (Undo) Demo       ");
        System.out.println("==================================================\n");

        TextEditor editor = new TextEditor();
        CommandHistory history = new CommandHistory();

        System.out.println("--- Scenario 1: Executing Commands ---");
        // User types some text
        ICommand cmd1 = new InsertTextCommand(editor, "Hello ");
        history.executeCommand(cmd1);

        ICommand cmd2 = new InsertTextCommand(editor, "World! ");
        history.executeCommand(cmd2);

        ICommand cmd3 = new InsertTextCommand(editor, "Oops. ");
        history.executeCommand(cmd3);

        System.out.println("\n[Current Document State]: " + editor.readDocument());


        System.out.println("\n--- Scenario 2: Undoing Commands (Ctrl+Z) ---");
        // User presses Ctrl+Z once
        history.undoLastCommand();
        System.out.println("[Current Document State]: " + editor.readDocument());
        
        // User presses Ctrl+Z again
        history.undoLastCommand();
        System.out.println("[Current Document State]: " + editor.readDocument());
    }
}
