package event;

public class FundsWithdrawnEvent extends DomainEvent {
    private final double amount;

    public FundsWithdrawnEvent(double amount) {
        this.amount = amount;
    }

    public double getAmount() { return amount; }
}
