# ⚡ 01 - Distributed Transactions

## 📋 Tracker Metadata
| Column | Value / Status |
| :--- | :--- |
| **Concept ID** | C089 |
| **Category** | Distributed Transactions |
| **Difficulty** | 🔥 Hard |
| **Interview Frequency** | 🔥 High |
| **Understanding** | [🔴 None / 🟡 Conceptual / 🟢 Applied] |
| **Can Explain** | [ ] Yes / [ ] No |
| **Whiteboard Drawn** | [ ] Yes / [ ] No |
| **Taught Someone** | [ ] Yes / [ ] No |
| **Next Review** | YYYY-MM-DD |
| **Mastery** | [🔴 Familiar / 🟡 Competent / 🟢 Expert] |

---

## ⚡ 1. The Core Definition & Trigger
*   **Two-Sentence Trigger:** Distributed Transactions are operations that span multiple independent databases or microservices but must maintain consistency (all commit or all rollback). They solve the consistency challenge in microservices, using patterns like Two-Phase Commit (2PC), Sagas (Choreography/Orchestration), or Try-Confirm-Cancel (TCC).
*   **Scalability Dimension:** Primary: **Data Consistency (ACID/BASE)** & **System Availability / Latency**.

---

## ⚖️ 2. Trade-offs & Deep Dive
| Pattern | Consistency Model | Performance | Recovery Mechanism |
| :--- | :--- | :--- | :--- |
| **Two-Phase Commit (2PC)** | Strong Consistency (ACID). | Slow. Blocks resources across databases during consensus. | Automatic rollback handled by coordinator. |
| [Saga Pattern](02-Saga-Pattern.md) | Eventual Consistency (BASE). | Fast. No resource locking; local commits run sequentially. | Requires writing custom **Compensating Transactions** (Undo operations). |
| **Try-Confirm-Cancel (TCC)** | Eventual/Soft Consistency. | Medium. Explicitly reserves resources before commits. | Custom application cancel logic. |

*   **Ideal Use Cases:**
    *   Saga: Multi-service booking flows (Flight + Hotel booking). See [Saga Pattern](02-Saga-Pattern.md) details.
    *   TCC: E-commerce order inventory reservations where stock must be "held" transiently before credit card approval.
*   **Anti-Patterns / When NOT to use:**
    *   Using 2PC in high-throughput cloud environments (if a single database node is slow or undergoes network partitioning, the entire transaction blocks indefinitely, crashing the API tier).

---

## 💥 3. Resiliency & Operations
*   **Observability (The "Signal"):**
    *   `Saga Failure/Rollback Rate`: Spikes indicate checkout flow failures.
    *   `Transaction Execution Duration`: Tracking how long multi-service sagas take to complete.
*   **Blast Radius (The "Impact"):**
    *   Partial execution failures (e.g., payment succeeds but inventory fails, and the compensation transaction fails) create major data drift, requiring manual DBA reconciliation.

---

## 🚫 4. Interview Playbook
*   **Common Mistakes:**
    *   Suggesting 2PC for microservices without explaining its latency and blocking lock issues (2PC is highly anti-scalable).
    *   Forgetting that Saga compensating transactions can fail too (you need a Dead Letter Queue or manual reconciliation task).
*   **Interview Tip (The "Strong Hire" Signal):**
    *   Recommend Saga Orchestration: *"For transactional checkouts, I will use the [Saga Orchestrator](02-Saga-Pattern.md) pattern over Choreography. A central coordinator makes it simple to trace the checkout state machine, handle complex compensating transaction logic, and prevents circular event loops."*

---

## 💡 5. My Custom Study Notes & Whiteboard
*Use this section to document your sketches, code blocks, or personal notes.*
