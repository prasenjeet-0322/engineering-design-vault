# 🎯 LLD Practice Questions (Classified by Difficulty & Trends)

To master Low-Level Design and Machine Coding, practice these problems in order. This list has been updated with core patterns, concurrency challenges, and **recent interview trends (2024–2026)** to reflect modern SDE-2/SDE-3 bars.

---

## 🟢 LEVEL 1: Foundations & Clean Design (Easy)
*Target: SDE-1 / Junior SDE-2. Focuses on SOLID principles, clean class relations, and state representation.*

### 1. Design a Parking Lot
*   **Core Patterns:** Factory (vehicle creation), Strategy (fee calculation).
*   **Key Challenge:** Setting up clean relationships between `Vehicle`, `Spot`, and `ParkingFloor`. Avoid making the parking lot a God class.
*   **Trend Status:** 🔥 Standard Classic.

### 2. Design a Vending Machine
*   **Core Patterns:** **State Pattern** (Idle, Ready, CoinInserted, Dispensing, OutOfStock).
*   **Key Challenge:** Transitioning states cleanly without huge `if-else` blocks in the orchestrator.
*   **Trend Status:** 🔥 Standard Classic.

### 3. Design an Elevator System
*   **Core Patterns:** Strategy Pattern (scheduling dispatch algorithms).
*   **Key Challenge:** Thread safety when elevator cars are moving concurrently, and handling up/down direction queues.
*   **Trend Status:** 🔥 Standard Classic.

---

## 🟡 LEVEL 2: Business Systems & Orchestration (Medium)
*Target: SDE-2 / Senior SDE-2. Focuses on dynamic business rules, consistency, and clean extensibility.*

### 1. Design BookMyShow (Movie Ticket Booking)
*   **Core Patterns:** Strategy (pricing/discounts), State (seat status: Available, Locked, Booked).
*   **Key Challenge:** **Concurrency:** Preventing double-booking of seats when thousands of users request the same seat at the same millisecond (solving via optimistic locking vs database locks).
*   **Trend Status:** 🚀 High (Common at BookMyShow, Ticketmaster, Disney+ Hotstar).

### 2. Design Splitwise (Expense Sharing)
*   **Core Patterns:** Strategy (Equal, Exact, Percentage split calculations), Command (to support undoing transactions).
*   **Key Challenge:** Designing the simplifying balance algorithm (reducing payment transactions among a group using a user balance graph).
*   **Trend Status:** 🔥 Standard Classic.

### 3. Design a Payment Gateway Router (Razorpay/Stripe Lite)
*   **Core Patterns:** Strategy (gateway routing), Factory (gateway client generation), Circuit Breaker (fault tolerance).
*   **Key Challenge:** **Idempotency & Reliability:** Preventing double-payments on API timeouts, and dynamically re-routing transactions to backup gateways (HDFC vs ICICI) based on real-time success rates.
*   **Trend Status:** 🚀 High (Extremely common in fintech: Razorpay, Stripe, PhonePe, Paytm).

### 4. Design a Logging Framework
*   **Core Patterns:** Chain of Responsibility (log levels), Observer (appenders: Console, File, Cloud), Adapter (third-party compatibility).
*   **Key Challenge:** Designing asynchronous logging where log requests are pushed to an in-memory queue to prevent blocking the application thread.
*   **Trend Status:** 🔥 Standard Classic.

---

## 🟠 LEVEL 3: Concurrency-Heavy & Platform Infrastructure (Hard)
*Target: SDE-3 / Architect. Focuses on low-latency, thread-safety, memory optimization, and distributed patterns.*

### 1. Design a Thread-Safe Key-Value Store with Transactions (ACID Lite)
*   **Core Patterns:** Command (storing transactions), Memento (reverting state).
*   **Key Challenge:** **Isolation Levels:** Supporting `begin()`, `set()`, `get()`, `commit()`, and `rollback()` per thread using `ThreadLocal` storage. Ensuring uncommitted transactions do not leak to other threads (Read Committed isolation).
*   **Trend Status:** 🚀 High (Frequently asked at Uber, Microsoft, Oracle).

### 2. Design a Token Bucket / Leaky Bucket Rate Limiter
*   **Core Patterns:** Decorator (wrapping endpoints with limits), Strategy (pluggable limit algorithms).
*   **Key Challenge:** **Concurrency:** Managing high-write throughput. Tracking requests thread-safely using `ConcurrentHashMap` and `AtomicLong` without causing thread starvation.
*   **Trend Status:** 🔥 High (Standard in almost all SDE-2/3 loops: Google, Uber, Amazon).

### 3. Design an In-Memory Message Queue (Kafka Lite)
*   **Core Patterns:** Observer Pattern.
*   **Key Challenge:** **Concurrency:** Structuring Consumer Groups and partition offsets. Ensuring multiple consumers in a group read from partitions thread-safely without missing or duplicating messages.
*   **Trend Status:** 🚀 High (Common at Confluent, LinkedIn, Uber).

### 4. Design an LLM Gateway / Proxy
*   **Core Patterns:** Strategy (LLM provider swapping), Decorator (token tracking/cost calculation), Circuit Breaker (fallback client).
*   **Key Challenge:** **Async Concurrency:** Structuring non-blocking virtual threads or Event Loops to stream server-sent tokens (SSE) back to the client while tracking real-time costs and enforcing token-rate-limits.
*   **Trend Status:** 🚀 High (Emerging 2025–2026 trend: AI-focused startups and enterprise platform teams).

---

## 💡 How to Practice

1.  **Use the [LLD Delivery Framework](./000-LLD_DELIVERY_FRAMEWORK.md):** 
    *   Spend the first 10 minutes clarifying the requirements and scale (e.g., *"Is this single-node or distributed? What is the read-to-write ratio?"*).
    *   Do not write business logic until interfaces are defined.
2.  **Explicitly Code for Concurrency:**
    *   Identify the shared resource (e.g., `seatsMap`, `userBalances`, `logQueue`).
    *   Write a unit test block illustrating thread safety using `CountDownLatch` and `ExecutorService`.
3.  **Identify the Core Extensibility Point:**
    *   Which part of this system is most likely to change? (e.g., payment gateways, eviction algorithms, discount strategies). Wrap that axis of change in an interface.
