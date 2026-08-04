package colleague;

import mediator.IChatRoom;

public class Developer extends User {

    public Developer(IChatRoom mediator, String name) {
        super(mediator, name);
    }

    @Override
    public void send(String msg) {
        System.out.println("   [Developer " + name + "] sending: " + msg);
        mediator.broadcastMessage(msg, this);
    }

    @Override
    public void receive(String msg) {
        System.out.println("      -> [Developer " + name + "] received: " + msg);
    }
}
