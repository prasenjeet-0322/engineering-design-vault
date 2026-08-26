# ⚡ Module 01: Concurrency, Thread Safety & Atomic State Transitions

[🏠 Back to Master Guide](./README.md) &nbsp; | &nbsp; [Next: 🧭 Transition Management & State Tables](./02-TRANSITION_MANAGEMENT_AND_STATE_TABLES.md)

---

## 🎯 Executive Overview

In multi-threaded applications, a naive implementation of the **State Pattern** is vulnerable to **severe race conditions**, **split-brain states**, and **illegal state transitions**.

If Thread A (calling `insertMoney()`) and Thread B (calling `pressCancelButton()`) execute concurrently on the same Vending Machine or Order context:
* The machine can transition to `DispensingState` while simultaneously refunding money in `IdleState`.
* The object reference pointer (`currentState`) can be left in an inconsistent intermediate state.

This deep dive details:
1. The **Atomic State Transition Race Condition**.
2. Lock-free state transitions using **`AtomicReference<State>` and CAS (Compare-And-Swap) loops**.
3. Reentrant synchronization and action atomicity.
4. Distributed optimistic locking with version numbers.

---

## 💥 1. The Multi-Threaded State Transition Bug

```
      Thread 1 (insertCoin)                         Thread 2 (pressCancel)
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
│ 1. Checks currentState == NoCoin     │     │ 1. Checks currentState == NoCoin     │
│ 2. Accepts $1.00 bill                │     │ 2. Cannot refund yet                 │
│ 3. Begins changing state...          │     │ 3. Context switch occurs!            │
│ 4. Sets currentState = HasCoin       │     │ 4. Reads currentState == HasCoin     │
│ 5. Triggers product dispense!        │     │ 5. Issues $1.00 refund!              │
└──────────────────────────────────────┘     └──────────────────────────────────────┘
         💥 Double Dip Bug: Customer receives both the Product AND the Refund!
```

---

## 🛡️ 2. Solution A: Lock-Free Atomic State Transitions (`AtomicReference` + CAS)

For high-throughput, low-latency state machines (like high-frequency trading order state or game servers), lock-free transitions eliminate thread blocking:

```java
import java.util.concurrent.atomic.AtomicReference;

public class AtomicOrderContext {
    private final AtomicReference<OrderState> stateRef;

    public AtomicOrderContext(OrderState initialState) {
        this.stateRef = new AtomicReference<>(initialState);
    }

    public boolean transition(OrderState expectedState, OrderState newState) {
        // 🔒 Atomic Compare-And-Swap (CAS):
        // Only updates to newState if current state strictly equals expectedState!
        return stateRef.compareAndSet(expectedState, newState);
    }

    public OrderState getState() {
        return stateRef.get();
    }

    public void pay() {
        OrderState current;
        do {
            current = stateRef.get();
            if (!(current instanceof PendingPaymentState)) {
                throw new IllegalStateException("Cannot pay in state: " + current.getClass().getSimpleName());
            }
            // Loop until CAS succeeds atomically without lock contention
        } while (!stateRef.compareAndSet(current, new PaidState()));

        System.out.println("✅ State atomically transitioned to PaidState");
    }
}
```

---

## 🛡️ 3. Solution B: Coordinated ReentrantLock (State + Action Atomicity)

When a state transition is coupled to an external side-effect (e.g. charging a credit card or moving a physical motor), the **action execution and state transition must be atomic together**:

```java
import java.util.concurrent.locks.ReentrantLock;

public class ThreadSafeVendingMachine {
    private VendingState currentState;
    private final ReentrantLock lock = new ReentrantLock(true); // Fair lock

    public ThreadSafeVendingMachine(VendingState initialState) {
        this.currentState = initialState;
    }

    public void insertCoin(double amount) {
        lock.lock();
        try {
            // Action and transition executed inside critical section
            currentState.insertCoin(this, amount);
        } finally {
            lock.unlock();
        }
    }

    public void dispense() {
        lock.lock();
        try {
            currentState.dispense(this);
        } finally {
            lock.unlock();
        }
    }

    public void changeState(VendingState newState) {
        // Protected: only called from within locked state methods
        this.currentState = newState;
    }
}
```

---

## 🌐 4. Distributed Concurrency: Optimistic Database Locking

In distributed microservices, state is stored in a database row rather than JVM heap memory. Multiple pods process events concurrently:

```sql
-- PostgreSQL / MySQL Optimistic Lock Pattern
UPDATE orders 
SET status = 'PAID', version = version + 1 
WHERE id = 'ORD-991' AND status = 'PENDING' AND version = 3;
```

* If two pods attempt to transition the order simultaneously, only **one update returns rows affected = 1**.
* The losing pod receives `rows affected = 0`, detects the concurrent modification, and aborts or retries safely.

---

## 📊 Summary: Concurrency Strategies for State Machines

| Concurrency Approach | Throughput | Lock Overhead | Best For |
|---|:---:|:---:|---|
| **Synchronized / ReentrantLock** | 🟡 Medium | 🔴 High lock contention | In-memory machines with physical I/O actions |
| **`AtomicReference` CAS Loop** | 🟢 Ultra High | 🟢 Zero (Lock-free) | Fast in-memory state flags (Trading, Game State) |
| **Optimistic Versioning (`version++`)** | 🟢 High | 🟢 Minimal (DB Row level) | Distributed Microservice Workflows (Spring/JPA) |

---

## 🔑 Key Takeaways for Interviews

1. Highlight that the primary multithreading vulnerability of the State Pattern is **non-atomic state transitions and action execution**.
2. Propose **`AtomicReference<State>`** and CAS loops for lock-free, high-performance in-memory state machines.
3. Connect in-memory state machines to **Database Optimistic Locking (`version` column)** for distributed microservice architectures.
