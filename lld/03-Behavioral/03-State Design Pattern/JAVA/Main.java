import context.Document;
import state.User;

/**
 * <h1>State Pattern Demonstration</h1>
 * 
 * <p>Notice how `Document` has zero `if` statements checking its state.
 * The State objects themselves control the transition logic and the 
 * behavior of the `.publish()` and `.render()` methods dynamically.
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("   State Pattern: Document Workflow Demo          ");
        System.out.println("==================================================\n");

        Document doc = new Document(); // Starts in DraftState
        User author = new User("Alice_Author", false);
        User admin = new User("Bob_Admin", true);

        System.out.println("--- Scenario 1: Author working on a Draft ---");
        doc.render(); // Draft rendering
        doc.publish(author); // Moves to Moderation

        System.out.println("\n--- Scenario 2: Author tries to bypass Moderation ---");
        doc.render(); // Moderation rendering
        doc.publish(author); // Fails (Requires Admin)

        System.out.println("\n--- Scenario 3: Admin approves the Document ---");
        doc.publish(admin); // Succeeds -> Moves to Published

        System.out.println("\n--- Scenario 4: User views the Published Document ---");
        doc.render(); // Published rendering

        System.out.println("\n--- Scenario 5: Admin tries to publish again ---");
        doc.publish(admin); // Fails (Already Published)
    }
}
