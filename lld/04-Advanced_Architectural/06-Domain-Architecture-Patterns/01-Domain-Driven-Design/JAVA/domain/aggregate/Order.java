package domain.aggregate;

import domain.entity.OrderItem;
import domain.event.OrderCompletedEvent;
import domain.event.OrderItemAddedEvent;
import domain.event.OrderPlacedEvent;
import domain.valueobject.Money;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * <h1>Order Aggregate Root — v2 (Rich Domain Model + Domain Events)</h1>
 *
 * <p>Improvements over v1:
 * <ol>
 *   <li><strong>Domain Events collection:</strong> Every state change raises
 *       a {@code DomainEvent} (e.g. {@code OrderPlacedEvent}). The application
 *       layer collects these events after the transaction commits and publishes
 *       them to an event bus (Kafka/RabbitMQ). This is the canonical DDD +
 *       Event-Driven Architecture integration point.</li>
 *
 *   <li><strong>Enum-based status:</strong> {@code String status} is
 *       replaced by a {@code Status} enum. Strings are stringly typed — a
 *       typo like {@code "COMPELTED"} would silently corrupt the state machine.
 *       Enums make illegal states unrepresentable at compile time.</li>
 *
 *   <li><strong>Business invariant methods:</strong> {@code cancel()} and
 *       {@code cancelReason} added to show a real state machine with
 *       multiple valid transitions, not just NEW → COMPLETED.</li>
 *
 *   <li><strong>Defensive copy on items:</strong> {@code getItems()} returns
 *       an unmodifiable view so callers cannot mutate the aggregate's
 *       internal state from outside.</li>
 * </ol>
 */
public class Order {

    public enum Status { NEW, CONFIRMED, CANCELLED, COMPLETED }

    private final String      orderId;
    private final String      customerId;
    private final List<OrderItem> items   = new ArrayList<>();
    private Status            status;
    private String            cancelReason;

    /** Uncommitted domain events raised during this transaction */
    private final List<Object> domainEvents = new ArrayList<>();

    public Order(String customerId) {
        this.orderId    = UUID.randomUUID().toString().substring(0, 8);
        this.customerId = customerId;
        this.status     = Status.NEW;

        // Raise event — will be published to Kafka after DB commit
        domainEvents.add(new OrderPlacedEvent(orderId, customerId));
    }

    // ---------------------------------------------------------------
    // Commands — each enforces an invariant before mutating state
    // ---------------------------------------------------------------

    public void addItem(OrderItem item) {
        requireStatus(Status.NEW, "add items to");
        items.add(item);
        domainEvents.add(new OrderItemAddedEvent(orderId, item.getProductId()));
    }

    public void completeOrder() {
        if (items.isEmpty()) throw new IllegalStateException("Order must have at least one item");
        requireStatus(Status.NEW, "complete");
        this.status = Status.COMPLETED;
        domainEvents.add(new OrderCompletedEvent(orderId, calculateTotal()));
        System.out.println("   [Order] " + orderId + " marked COMPLETED. Event raised.");
    }

    public void cancel(String reason) {
        if (status == Status.COMPLETED) {
            throw new IllegalStateException("Cannot cancel a COMPLETED order");
        }
        this.status       = Status.CANCELLED;
        this.cancelReason = reason;
        System.out.println("   [Order] " + orderId + " CANCELLED: " + reason);
    }

    // ---------------------------------------------------------------
    // Queries
    // ---------------------------------------------------------------

    public Money calculateTotal() {
        if (items.isEmpty()) return new Money(0, "USD");
        String currency = items.get(0).getPrice().getCurrency();
        double total = items.stream().mapToDouble(i -> i.getTotalPrice().getAmount()).sum();
        return new Money(total, currency);
    }

    public String          getOrderId()     { return orderId; }
    public String          getCustomerId()  { return customerId; }
    public Status          getStatus()      { return status; }
    public List<OrderItem> getItems()       { return Collections.unmodifiableList(items); }

    /** Called by the application layer after tx commit to publish events */
    public List<Object> getAndClearDomainEvents() {
        List<Object> events = new ArrayList<>(domainEvents);
        domainEvents.clear();
        return events;
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------

    private void requireStatus(Status required, String action) {
        if (this.status != required) {
            throw new IllegalStateException(
                "Cannot " + action + " an order in status: " + this.status);
        }
    }

    @Override
    public String toString() {
        return "Order{id=" + orderId + ", status=" + status + ", total=" + calculateTotal() + "}";
    }
}
