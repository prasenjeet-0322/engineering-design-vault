# ⚡ 04 - Database Sharding

## 📋 Tracker Metadata
| Column | Value / Status |
| :--- | :--- |
| **Concept ID** | C063 |
| **Category** | Database Scaling |
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
*   **Two-Sentence Trigger:** Database Sharding is a horizontal database scaling strategy where data is partitioned across multiple physical database server nodes (shards). It divides write workload and storage across independent physical machines, allowing a system to scale writes beyond the capacity of a single master node (see [SQL vs. NoSQL Decision](../05-Databases/01-SQL-vs-NoSQL-Decision.md)).
*   **Scalability Dimension:** Primary: **Write Throughput (QPS)** & **Storage Capacity (horizontal disk scaling)**.
*   **Key Distinction:** Do not confuse Sharding (horizontal scaling across multiple servers) with [Database Partitioning](03-Database-Partitioning.md) (vertical split within a single server instance).

---

## ⚖️ 2. Trade-offs & Deep Dive
| Sharding Strategy | Pros | Cons |
| :--- | :--- | :--- |
| **Key-Based (Hash Sharding)** | Uniform data distribution, avoids hot-spots. | Re-sharding is complex (mitigated via [Consistent Hashing](../03-Load-Balancing/01-Consistent-Hashing.md)). Cross-shard joins are impossible. |
| **Range-Based Sharding** | Simple routing, allows efficient range queries within a shard. | Creates hot-spots (e.g., active current data concentrated on one shard). |
| **Directory-Based Sharding** | Flexible; moving rows or shards is easy via metadata registry. | The directory registry is a single point of failure and adds network latency. |

### The SDE-3 / L5 Sharding Trade-offs

#### 1. Cross-Shard Transactions
When a write operation updates records on different shards (e.g., transferring balance from User A on Shard 1 to User B on Shard 2), standard ACID transactions are lost.
*   **Mitigation:** Enforce distributed transaction protocols like [Two-Phase Commit](../08-Distributed-Transactions/03-Two-Phase-Commit.md) (strongly consistent but slow/blocking) or the [Saga Pattern](../08-Distributed-Transactions/02-Saga-Pattern.md) (eventually consistent, choreography/orchestration).

#### 2. Local vs. Global Secondary Indexes
If you shard by `user_id` but need to look up a user by `email`:
*   **Local Secondary Index (LSI):** Each shard only indexes its local data. Finding a user by `email` requires a **Scatter-Gather** query, hitting all shards (inefficient).
*   **Global Secondary Index (GSI):** A separate index table is maintained, sharded by `email`. A lookup first queries the GSI to find the `user_id`, then queries the primary shard.

#### 3. High Availability (HA) of Shards
A single shard node is a Single Point of Failure (SPOF).
*   **Design Pattern:** Each shard should be deployed as a replica set with a leader and [Read Replicas](02-Read-Replicas.md) to ensure high availability and load distribution.

*   **Ideal Use Cases:**
    *   Massive, high-scale applications (e.g., chat apps, social networks, payment processors) where writes exceed a single database master node's capacity.
*   **Anti-Patterns / When NOT to use:**
    *   Small systems that can easily scale writes via vertical hardware upgrades or scale reads via read-replicas.

---

## 💥 3. Resiliency & Operations
*   **Observability (The "Signal"):**
    *   `Shard CPU/IO utilization imbalances`: Identifies hot spots.
    *   `Cross-shard query frequency`: Monitoring queries that span multiple shards (scatter-gather queries).
*   **Blast Radius (The "Impact"):**
    *   If a shard node crashes, all users mapped to that shard experience outage states. A misconfigured partition key can route all traffic to a single shard, crashing it (The Celebrity Problem).
*   **Logical Architecture:**
    ```
    Application ──> [Routing Layer (Vitess/Proxy)]
                                 │
                   ┌─────────────┼─────────────┐
                   ▼             ▼             ▼
              [Shard 1]     [Shard 2]     [Shard 3] 
            (Replica Set) (Replica Set) (Replica Set) 
    ```
    *(Note: Each Shard should use [Database Replication](01-Database-Replication.md) internally to prevent data loss).*

---

## 🚫 4. Interview Playbook
*   **Common Mistakes:**
    *   Selecting a bad **Shard Key** (e.g., sharding by date or tenant ID, which creates hot nodes).
    *   Failing to explain how to join sharded tables (joins must be executed in application memory, which is slow).
    *   Confusing horizontal sharding with vertical [Database Partitioning](03-Database-Partitioning.md).
*   **Interview Tip (The "L5 / Strong Hire" Signal):**
    *   Solve the Celebrity Problem: *"To handle hot-spotting for popular keys, I will implement **Shard Key Salting**—appending a random prefix (e.g., `user123_1`, `user123_2`) to the partition key for massive users, spreading their write load uniformly across multiple physical shards (see [Wide-Column Database Design](../17-Data-Modeling-at-Scale/02-Wide-Column-Database-Design.md)). Additionally, we will route our writes through a middleware like Vitess using [Consistent Hashing](../03-Load-Balancing/01-Consistent-Hashing.md) to minimize data movement during future shard rebalancing."*

---

## 💡 5. My Custom Study Notes & Whiteboard
*Use this section to document your sketches, code blocks, or personal notes.*
