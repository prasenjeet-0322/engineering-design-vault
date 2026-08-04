package mediator;

import colleague.User;
import java.util.ArrayList;
import java.util.List;

/**
 * <h1>The Concrete Mediator</h1>
 * 
 * <p>Acts as the central hub. All routing logic is encapsulated here.
 * If Dev A wants to talk to Manager B, the message goes through here.
 */
public class SlackChannel implements IChatRoom {

    private final List<User> users = new ArrayList<>();

    @Override
    public void registerUser(User user) {
        this.users.add(user);
    }

    @Override
    public void broadcastMessage(String msg, User sender) {
        for (User user : users) {
            // Don't send the message to the person who originally sent it!
            if (user != sender) {
                user.receive(msg);
            }
        }
    }
}
