package domain.event;

public record OrderPlacedEvent(String orderId, String customerId) {}
