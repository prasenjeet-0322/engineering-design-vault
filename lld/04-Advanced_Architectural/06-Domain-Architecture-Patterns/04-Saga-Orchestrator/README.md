# 🔄 Saga Orchestrator Pattern

## 📖 1. The Core Concept (The "Why")
In a microservices architecture, a single business transaction (like "Placing an Order") often spans multiple separate databases and services. 

### ⚠️ The Problem: Distributed Data Inconsistency
In a monolith, you can use a single `@Transactional` block. In microservices, if the `PaymentService` succeeds but the `InventoryService` fails, the user has been charged but will never get their item! Since we cannot "Lock" multiple databases over the internet (2-Phase Commit is too slow), we need a better way to ensure consistency.

### ✅ The Solution: The Saga Pattern
A **Saga** is a sequence of local transactions. Each local transaction updates the database and publishes a message or event to trigger the next local transaction in the saga. 

**The Orchestrator:** This demo specifically uses the **Orchestrator-based Saga**. A central "Brain" (The Orchestrator) tells each service what to do. If any service fails, the Orchestrator is responsible for calling **Compensating Transactions** (Undo operations) for all the steps that already succeeded.

---

## 💻 2. SDE-2+ Enterprise Java Implementation

In high-scale production systems, Sagas are implemented using **Event-Driven asynchronous messaging** (Kafka or RabbitMQ). 
*   **Choreography Saga:** Services listen to events from each other and decide what to do (Decentralized).
*   **Orchestration Saga:** A centralized service (like AWS Step Functions or Netflix Conductor) manages the entire workflow (Centralized).

**Compensating Transactions:** These must be **Idempotent**. If the "Refund" command is sent twice due to a network retry, the system must ensure the user isn't refunded twice!

### 🏗️ Why it matters for Scaling 
The Saga pattern provides **Eventual Consistency**. It is the only way to scale a system to millions of users while maintaining data integrity across dozens of microservices.

## ▶️ Execution
To run the Java implementation, go into the `JAVA` folder and see the specific `README.md`.
