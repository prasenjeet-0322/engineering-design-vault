# ⚡ CQRS (Command Query Responsibility Segregation)

## 📖 1. The Core Concept (The "Why")
**CQRS** is an architectural pattern that suggests splitting your system into two completely separate parts: 
1. **Commands:** These are operations that *change* the state of the system (Writes). 
2. **Queries:** These are operations that *read* the state of the system (Reads).

### ⚠️ The Problem: Data Contention
In traditional CRUD applications, the same data model is used for both reading and writing. As traffic grows, your read-heavy operations start competing with your write-heavy operations for database locks and CPU cycles. This makes the system slow for everyone. 

### ✅ The Solution: CQRS
By splitting them:
*   **Performance:** You can optimize the Write Model for security and consistency, while optimizing the Read Model solely for speed (using indexing, denormalization, or caching).
*   **Scalability:** You can scale your Read replicas independently of your Write master database.

---

## 💻 2. SDE-2+ Enterprise Java Implementation

In high-scale systems, CQRS is often implemented alongside **Event Sourcing**.
*   **Command Side:** Validates business rules and publishes a **Domain Event**.
*   **Query Side:** A completely different database (like ElasticSearch or a specialized View table) listens for those events and updates its own "Read Model" asynchronously.

**Eventual Consistency:** This introduces "Eventual Consistency". The user clicks "Save," the Write model confirms it, but the Read model might take 100ms-500ms to reflect the change.

### 🏗️ Why it matters for Scaling 
Most modern e-commerce sites (Amazon, Flipkart) use CQRS. When you search for a product, you are talking to a Read Model (likely ElasticSearch). When you click "Buy Now," you are talking to the Write Model (likely a SQL Transactional DB).

## ▶️ Execution
To run the Java implementation, go into the `JAVA` folder and see the specific `README.md`.
