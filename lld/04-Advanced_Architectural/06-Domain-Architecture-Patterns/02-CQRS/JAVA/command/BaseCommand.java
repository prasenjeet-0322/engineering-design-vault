package command;

import java.util.UUID;

public abstract class BaseCommand {
    private final String id;

    public BaseCommand() {
        this.id = UUID.randomUUID().toString();
    }

    public String getId() { return id; }
}
