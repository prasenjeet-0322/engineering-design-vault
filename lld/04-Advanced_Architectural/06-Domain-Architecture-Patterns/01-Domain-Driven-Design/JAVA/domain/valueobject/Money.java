package domain.valueobject;

import java.util.Objects;

/**
 * <h1>The Value Object</h1>
 * 
 * <p>Immutable, has no identity, and is defined solely by its values. 
 * Two Money objects with the same amount and currency are equal.
 */
public final class Money {
    private final double amount;
    private final String currency;

    public Money(double amount, String currency) {
        if (amount < 0) throw new IllegalArgumentException("Amount cannot be negative");
        this.amount = amount;
        this.currency = Objects.requireNonNull(currency);
    }

    public double getAmount() { return amount; }
    public String getCurrency() { return currency; }

    public Money add(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException("Currency mismatch");
        }
        return new Money(this.amount + other.amount, this.currency);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Money money = (Money) o;
        return Double.compare(money.amount, amount) == 0 && currency.equals(money.currency);
    }

    @Override
    public int hashCode() {
        return Objects.hash(amount, currency);
    }

    @Override
    public String toString() {
        return amount + " " + currency;
    }
}
