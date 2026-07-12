# 🎯 LLD Mastery Checklist: Phase-Wise System Design Guide

This checklist organizes the core evaluation points across the LLD curriculum. Before an interview, ensure you can confidently implement and articulate these concepts.

---

## 🗺️ Phase 1: Foundations & SOLID
- [ ] **SRP**: Can you identify a class that has two reasons to change and split it?
- [ ] **OCP**: Can you replace a growing `switch` statement with polymorphism and the Strategy pattern?
- [ ] **LSP**: Can you explain why a `Square` extending `Rectangle` violates behavioral expectations?
- [ ] **ISP**: Do you separate "Fat" interfaces into smaller role-based interfaces (e.g., `Flyable`, `Swimmable`)?
- [ ] **DIP**: Are your high-level orchestrator classes depending on interfaces rather than concrete database drivers?

---

## 🗺️ Phase 2: Creational Patterns
- [ ] **Singleton**: Can you write a Thread-Safe Singleton using Double-Checked Locking in under 2 minutes?
- [ ] **Factory Method**: Can you use a Factory to hide the complex instantiation logic of subclasses?
- [ ] **Builder**: Can you use a Builder for an object with 10+ optional parameters to avoid telescopic constructors?

---

## 🗺️ Phase 3: Structural Patterns
- [ ] **Adapter**: Can you write a wrapper class that makes an incompatible legacy API work with your new interface?
- [ ] **Decorator**: Can you use a Decorator to dynamically add features (like toppings to a pizza) without extending classes?
- [ ] **Facade**: Can you hide a complex subsystem of 5 interacting classes behind a single, simplified `OrderFacade`?

---

## 🗺️ Phase 4: Behavioral Patterns
- [ ] **Strategy**: Can you swap out a `PricingStrategy` at runtime without altering the `Cart` class?
- [ ] **Observer**: Can you implement a Pub/Sub system where multiple `EmailListeners` react to an `OrderPlacedEvent`?
- [ ] **State**: Can you eliminate `if (state == READY)` checks by delegating behavior to State interface implementations?
- [ ] **Chain of Responsibility**: Can you chain `Authentication`, `RateLimiting`, and `Logging` handlers for an API request?

---

## 🗺️ Phase 5 & 6: Concurrency & Advanced (Addons)
- [ ] **Thread Safety**: Can you explain the difference between `synchronized`, `ReentrantLock`, and `ReadWriteLock`?
- [ ] **Optimistic Locking**: Can you explain how a `version` integer in the database prevents lost updates during concurrent bookings?
- [ ] **Concurrent Collections**: Do you know when to use `ConcurrentHashMap` over `Collections.synchronizedMap()`?
- [ ] **LRU Cache**: Can you implement an O(1) thread-safe LRU cache using a Doubly Linked List and Double-Checked Locking?
