package domain.event;

public record OrderItemAddedEvent(String orderId, String productId) {}
