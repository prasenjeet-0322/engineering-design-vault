package event;

public class FundsDepositedEvent extends DomainEvent {
    private final double amount;

    public FundsDepositedEvent(double amount) {
        this.amount = amount;
    }

    public double getAmount() { return amount; }
}
