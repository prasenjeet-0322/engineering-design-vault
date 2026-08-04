import colleague.Developer;
import colleague.Manager;
import colleague.User;
import mediator.IChatRoom;
import mediator.SlackChannel;

/**
 * <h1>Mediator Pattern Demonstration</h1>
 * 
 * <p>Notice how `alice` sends a message, but she never explicitly calls 
 * `bob.receive()`. She just tells the Mediator to broadcast it.
 * This completely decouples Alice and Bob.
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("   Mediator Pattern: Chat Room Demo               ");
        System.out.println("==================================================\n");

        IChatRoom slack = new SlackChannel();

        User alice = new Developer(slack, "Alice");
        User bob = new Developer(slack, "Bob");
        User charlie = new Manager(slack, "Charlie");

        slack.registerUser(alice);
        slack.registerUser(bob);
        slack.registerUser(charlie);

        System.out.println("--- Scenario 1: Alice sends a message ---");
        alice.send("Hey team, the build is broken again.");

        System.out.println("\n--- Scenario 2: Charlie (Manager) replies ---");
        charlie.send("Who broke it this time?");
    }
}
