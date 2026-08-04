package colleague;

import mediator.IChatRoom;

public class Manager extends User {

    public Manager(IChatRoom mediator, String name) {
        super(mediator, name);
    }

    @Override
    public void send(String msg) {
        System.out.println("   [Manager " + name + "] sending: " + msg);
        mediator.broadcastMessage(msg, this);
    }

    @Override
    public void receive(String msg) {
        System.out.println("      -> [Manager " + name + "] received: " + msg);
    }
}
