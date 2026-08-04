# 🎯 LLD Mastery Checklist: SDE-2 / SDE-3 Self-Audit Guide

This checklist organizes the core evaluation points across the LLD curriculum. Before your interviews, use this sheet to audit your readiness. 

### 📊 Self-Audit Rating System:
*   🔴 **Weak:** You know the theory but struggle to write bug-free code under a 40-minute timer.
*   *Signal:* Need to practice writing simple in-memory implementations.
*   🟡 **Medium:** You can write the code but might miss concurrency lock optimizations or OCP boundaries.
*   *Signal:* Need to practice refactoring with Strategy/State patterns and concurrent collections.
*   🟢 **Strong:** You can write compilable, generic, thread-safe code and explain architectural trade-offs immediately.
*   *Signal:* Ready for FAANG/Google bar.

---

## 🗺️ Phase 1: Foundations & SOLID
- [ ] **SRP (Single Responsibility):** Can you identify when a class has multiple stakeholders (e.g., Finance vs. Security) and split it into clean, cohesive modules?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*
- [ ] **OCP (Open-Closed):** Can you replace a growing `switch/if-else` block with polymorphism and the Strategy/Factory pattern to make it open for extension?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*
- [ ] **LSP (Liskov Substitution):** Can you explain the "Square/Rectangle" or "Ostrich/Bird" problem and resolve it using interface segregation or "Tell, Don't Ask"?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*
- [ ] **ISP (Interface Segregation):** Can you identify a "Fat Interface" that forces clients to implement unused methods (e.g., throwing `UnsupportedOperationException`) and split it?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*
- [ ] **DIP (Dependency Inversion):** Can you decouple high-level business rules from low-level details (like database drivers or external API clients) using domain-owned interfaces?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*

---

## 🗺️ Phase 2: Creational Patterns
- [ ] **Singleton:** Can you implement a thread-safe Singleton using Double-Checked Locking and explain why the `volatile` keyword is mandatory?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*
- [ ] **Factory Method:** Can you decouple object creation from the caller, enabling pluggable creation logic based on runtime config?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*
- [ ] **Builder:** Can you write a Builder pattern to construct objects with 10+ optional fields to avoid constructor telescoping and preserve immutability?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*

---

## 🗺️ Phase 3: Structural Patterns
- [ ] **Adapter:** Can you wrap an incompatible third-party API (e.g., Pinecone client) to match your domain's vector search interface?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*
- [ ] **Decorator:** Can you dynamically add cross-cutting concerns (like logging, cost tracking, or transaction timing) around an interface without changing its concrete classes?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*
- [ ] **Facade:** Can you unify a complex subsystem of 5+ interacting classes (e.g., stock check, payment, shipping, notifications) behind a single orchestrator?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*
- [ ] **Composite:** Can you represent hierarchical part-whole structures (like a nested rule engine, file directory, or org chart) using a single uniform component interface?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*

---

## 🗺️ Phase 4: Behavioral Patterns
- [ ] **Strategy:** Can you inject different tax, discount, or payment routing strategies at runtime without modifying the caller class?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*
- [ ] **Observer:** Can you write a custom thread-safe pub/sub event bus where listeners register dynamically and handle broadcast events asynchronously?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*
- [ ] **State:** Can you model a finite state machine (e.g., Vending Machine, Order Delivery) by delegating behavior to dedicated State classes to eliminate state flag checks?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*
- [ ] **Chain of Responsibility:** Can you build a request pipeline where requests pass sequentially through validation, authentication, rate-limiting, and audit logging handlers?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*

---

## 🗺️ Phase 5: Concurrency & Thread-Safety (SDE-2+ Key Bar)
- [ ] **Locks Comparison:** Can you choose between `synchronized` (mutual exclusion), `ReentrantLock` (interruptible/fair locks), and `ReentrantReadWriteLock` (read-heavy optimizations) based on request profiles?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*
- [ ] **Optimistic Locking:** Can you write an in-memory or database version check to detect write collisions during concurrent mutations (e.g., seat booking)?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*
- [ ] **Concurrent Collections:** Do you know when to use `ConcurrentHashMap` (segment bucket locks) vs. `CopyOnWriteArrayList` (thread-safe reads with copy-on-write overhead) vs. `BlockingQueue`?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*
- [ ] **Thread-Safe Cache:** Can you write an $O(1)$ LRU/LFU cache using a custom Doubly Linked List, `ConcurrentHashMap`, and fine-grained locks?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*

---

## 🗺️ Phase 6: Production-Grade Fintech & AI Addons (SDE-3 Bar)
- [ ] **Idempotency Service:** Can you design a reusable API middleware that caches response payloads using request idempotency keys and prevents double-charges under race conditions?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*
- [ ] **Transactional Outbox:** Can you design a pattern that guarantees eventual consistency by writing database mutations and event payloads to the same DB transaction before dispatching events?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*
- [ ] **Circuit Breaker:** Can you implement a stateful circuit breaker (Closed, Open, Half-Open) to fail-fast and redirect requests when an external API gateway times out?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*
- [ ] **LLM Router Strategy:** Can you dynamically route prompts to optimal LLM providers based on prompt size, token limits, latency history, and failover status?  
    *Rating: [ 🔴 / 🟡 / 🟢 ]*
