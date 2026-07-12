package domain.event;

import domain.valueobject.Money;

public record OrderCompletedEvent(String orderId, Money total) {}
