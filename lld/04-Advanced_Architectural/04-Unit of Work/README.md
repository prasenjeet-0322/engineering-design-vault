# 💾 Data Access Patterns: Unit Of Work

## 📖 1. The Core Concept (The "Why")
In a real-world enterprise application, a single user action (like "Placing an Order") often involves multiple database updates:
1.  Decrement stock in `InventoryTable`.
2.  Create record in `OrdersTable`.
3.  Add entry to `PaymentLog`.

### ⚠️ The Problem: Dirty Data
If a network error occurs after step 2 but before step 3, your system is in a "corrupted state". You have an order but no payment record!

### ✅ The Solution: Unit Of Work
The **Unit Of Work** acts as a "Buffer" or "Transaction Tracker". Instead of repositories talking to the database immediately, they register their changes with the Unit Of Work. 
When the business operation is finished, you call `uow.commit()`. The Unit Of Work then opens a **single database transaction** and pushes all changes in one atomic block. If any step fails, it rolls back everything.

---

## 💻 2. SDE-2+ Enterprise Java Implementation

In **Hibernate** and **Spring Data JPA**, the `EntityManager` or `Session` is a literal implementation of the Unit of Work pattern. It tracks which objects are "Dirty" and automatically pushes updates during the `@Transactional` flush phase.

### 🏗️ Why it matters for Scaling 
*   **Reduced IO:** Instead of making 10 separate SQL calls, the Unit of Work can batch them into a single round-trip to the database, drastically reducing network latency.
*   **Consistency:** It ensures your system follows ACID principles at the application level.

## ▶️ Execution
To run the Java implementation, go into the `JAVA` folder and see the specific `README.md`.
