package aggregate;

import event.AccountCreatedEvent;
import event.DomainEvent;
import event.FundsDepositedEvent;
import event.FundsWithdrawnEvent;

import java.util.ArrayList;
import java.util.List;

/**
 * <h1>The Event-Sourced Aggregate</h1>
 * 
 * <p>This class does NOT have its state set directly. 
 * Instead, it "applies" events to mutate its internal fields.
 */
public class BankAccount {
    private String id;
    private String owner;
    private double balance;

    // The in-memory event store (The Source of Truth)
    private final List<DomainEvent> changes = new ArrayList<>();

    public BankAccount() {}

    /**
     * Applies a new event to the aggregate and records it.
     */
    public void apply(DomainEvent event) {
        handle(event);
        changes.add(event);
    }

    /**
     * Rebuilds state by replaying an existing sequence of events.
     */
    public void loadFromHistory(List<DomainEvent> history) {
        for (DomainEvent event : history) {
            handle(event);
        }
    }

    private void handle(DomainEvent event) {
        if (event instanceof AccountCreatedEvent e) {
            this.id = e.getAccountId();
            this.owner = e.getOwner();
            this.balance = 0;
        } else if (event instanceof FundsDepositedEvent e) {
            this.balance += e.getAmount();
        } else if (event instanceof FundsWithdrawnEvent e) {
            this.balance -= e.getAmount();
        }
    }

    public List<DomainEvent> getUncommittedChanges() {
        return changes;
    }

    @Override
    public String toString() {
        return "BankAccount{id='" + id + "', owner='" + owner + "', balance=" + balance + "}";
    }
}
