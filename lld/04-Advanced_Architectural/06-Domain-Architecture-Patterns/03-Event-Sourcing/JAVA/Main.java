import aggregate.BankAccount;
import event.AccountCreatedEvent;
import event.DomainEvent;
import event.FundsDepositedEvent;
import event.FundsWithdrawnEvent;

import java.util.ArrayList;
import java.util.List;

/**
 * <h1>Event Sourcing Design Pattern Demo</h1>
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("   Architecture: Event Sourcing Design Pattern    ");
        System.out.println("==================================================\n");

        System.out.println("--- Scenario 1: Generating Events ---");
        BankAccount account = new BankAccount();
        
        account.apply(new AccountCreatedEvent("ACT-101", "Alice"));
        account.apply(new FundsDepositedEvent(500.0));
        account.apply(new FundsWithdrawnEvent(100.0));
        account.apply(new FundsDepositedEvent(250.0));

        System.out.println("Current State: " + account);
        
        // Simulating persistent storage by saving the events
        List<DomainEvent> eventStore = new ArrayList<>(account.getUncommittedChanges());
        System.out.println("Events saved to SQL/NoSQL Event Store: " + eventStore.size());

        System.out.println("\n--- Scenario 2: Rebuilding State from History ---");
        BankAccount restoredAccount = new BankAccount();
        restoredAccount.loadFromHistory(eventStore);
        
        System.out.println("Restored State: " + restoredAccount);
        
        System.out.println("\n✅ State restored successfully by replaying all 4 immutable events.");
    }
}
