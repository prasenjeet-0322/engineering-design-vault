# 🏗️ Domain-Driven Design (DDD)

## 📖 1. The Core Concept (The "Why")
**Domain-Driven Design (DDD)** is an architectural philosophy that shifts the focus from "How do we store data?" to "How does the business work?". It aligns the code structure with the business domain.

### ⚠️ The Problem: Anemic Domain Model
In many applications, classes like `Order` are just collections of getters and setters (Anemic). All business rules are scattered in separate `Service` classes. This leads to code that is hard to maintain and prone to bugs (e.g. forgetting to check if an order is valid before adding an item).

### ✅ The Solution: Rich Domain Model
DDD introduces several key patterns to organize business logic:

1.  **Value Objects:** Immutable objects without identity (e.g. `Money`, `Address`). If two VOs have the same values, they are identical.
2.  **Entities:** Objects with a unique identity (e.g. `User`, `Product`). Even if their attributes change, the identity remains.
3.  **Aggregates:** A cluster of associated objects treated as a single unit (e.g. `Order` + `OrderItems`).
4.  **Aggregate Root:** The entity through which all external access to the aggregate must go. It enforces **Invariants** (Business Rules).

---

## 💻 2. SDE-2+ Enterprise Java Implementation

In Enterprise systems, DDD ensures that the core business logic remains isolated from infrastructure concerns (Web, DB, API).

*   **Bounded Contexts:** Large systems are split into smaller contexts (e.g. "Shipping", "Billing", "Inventory") that only communicate through well-defined APIs.
*   **Ubiquitous Language:** Developers and Business Analysts use the exact same terms in the code as in the real world.

### 🏗️ Why it matters for Scaling 
DDD prevents the "Big Ball of Mud" where every part of the system is tightly coupled to every other part. It allows small teams to work on independent Bounded Contexts without breaking the entire system.

## ▶️ Execution
To run the Java implementation, go into the `JAVA` folder and see the specific `README.md`.
