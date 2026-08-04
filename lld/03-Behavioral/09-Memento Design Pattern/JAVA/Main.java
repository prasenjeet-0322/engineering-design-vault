import caretaker.History;
import memento.DocumentMemento;
import originator.TextDocument;

/**
 * <h1>Memento Pattern Demonstration</h1>
 * 
 * <p>Notice how the Main client acts as the overarching orchestrator.
 * It asks the Originator to save state, pushes that state to the Caretaker, 
 * and later pops it back to restore it. 
 * **Crucially: The Main client and the Caretaker NEVER read the contents of the Memento.**
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("   Memento Pattern: Undo (Ctrl+Z) Demo            ");
        System.out.println("==================================================\n");

        History history = new History();
        TextDocument document = new TextDocument("Initial Draft", "Arial", 12);

        System.out.println("--- Scenario 1: Making Edits ---");
        System.out.println(document.toString());
        
        // Save state BEFORE making a change!
        history.push(document.save()); 

        document.setContent("Second Draft");
        document.setFont("Times New Roman");
        System.out.println(document.toString());

        // Save state BEFORE making another change!
        history.push(document.save());

        document.setContent("Final Draft. Wait, this looks terrible.");
        document.setFontSize(72);
        System.out.println(document.toString());


        System.out.println("\n--- Scenario 2: Pressing Ctrl+Z (Undo) ---");
        DocumentMemento previousState = history.pop();
        if (previousState != null) {
            document.restore(previousState);
            System.out.println(document.toString());
        }

        System.out.println("\n--- Scenario 3: Pressing Ctrl+Z again (Undo) ---");
        DocumentMemento firstState = history.pop();
        if (firstState != null) {
            document.restore(firstState);
            System.out.println(document.toString());
        }
    }
}
