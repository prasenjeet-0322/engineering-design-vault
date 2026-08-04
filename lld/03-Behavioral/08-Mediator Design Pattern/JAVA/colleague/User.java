package colleague;

import mediator.IChatRoom;

/**
 * <h1>The Abstract Colleague</h1>
 * 
 * <p>All colleagues possess a reference back to the Mediator.
 * They NEVER communicate with other colleagues directly.
 */
public abstract class User {
    protected IChatRoom mediator;
    protected String name;

    public User(IChatRoom mediator, String name) {
        this.mediator = mediator;
        this.name = name;
    }

    public abstract void send(String msg);
    public abstract void receive(String msg);
    
    public String getName() { return name; }
}
