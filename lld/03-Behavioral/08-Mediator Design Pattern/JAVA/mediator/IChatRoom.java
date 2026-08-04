package mediator;

import colleague.User;

/**
 * <h1>The Mediator Interface</h1>
 * 
 * <p>Exposes the methods Colleagues use to communicate.
 */
public interface IChatRoom {
    void broadcastMessage(String msg, User sender);
    void registerUser(User user);
}
