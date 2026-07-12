# 🕒 Event Sourcing

## 📖 1. The Core Concept (The "Why")
**Event Sourcing** is a powerful architectural pattern where you don't store the current "State" of an object in your database. Instead, you store the entire **History of Events** that happened to that object.

### ⚠️ The Problem: Loss of Intent
In a traditional SQL database, if a user changes their address, you run an `UPDATE users SET address = 'New Address' WHERE id = 123;`. The old address is gone forever. You have lost the history and the "intent" of the user.

### ✅ The Solution: Event Sourcing
Instead of an `UPDATE`, you create a new record in an append-only log: `UserMovedEvent(id=123, old='Old Address', new='New Address')`.
*   **Audit Trail:** You can see every single change that has ever happened.
*   **Time Travel:** You can rebuild the exact state of your system as it was on any specific day in the past.
*   **Debugging:** If there is a bug today, you can replay the exact events in your development environment to see exactly when the state became corrupted.

---

## 💻 2. SDE-2+ Enterprise Java Implementation

In high-scale systems, Event Sourcing is combined with **CQRS**.
*   The **Write Model** saves events to an **Event Store** (an append-only database like EventStoreDB or just a specialized SQL table).
*   The **Read Model** (Projection) listens to these events and updates a separate data store (like MongoDB or Redis) to provide fast queries.

**Snapshots:** If an object has 10,000,000 events, replaying them every time it loads is too slow. Senior architects implement **Snapshots** (e.g., save the state every 100 events) and only replay the events that happened *after* the last snapshot.

### 🏗️ Why it matters for Scaling 
Event Sourcing is the industry standard for **Banking** and **Accounting** systems. If you can't explain why a user's balance is $500, you have failed as a financial engineer. With Event Sourcing, you can prove it by adding up every single transaction (event) in history.

## ▶️ Execution
To run the Java implementation, go into the `JAVA` folder and see the specific `README.md`.
