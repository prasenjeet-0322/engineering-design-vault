# ⚡ 03 - Database Partitioning

## 📋 Tracker Metadata
| Column | Value / Status |
| :--- | :--- |
| **Concept ID** | C062 |
| **Category** | Database Scaling |
| **Difficulty** | 🟡 Medium |
| **Interview Frequency** | 🟡 Medium |
| **Understanding** | [🔴 None / 🟡 Conceptual / 🟢 Applied] |
| **Can Explain** | [ ] Yes / [ ] No |
| **Whiteboard Drawn** | [ ] Yes / [ ] No |
| **Taught Someone** | [ ] Yes / [ ] No |
| **Next Review** | YYYY-MM-DD |
| **Mastery** | [🔴 Familiar / 🟡 Competent / 🟢 Expert] |

---

## ⚡ 1. The Core Definition & Trigger
*   **Two-Sentence Trigger:** Database Partitioning (or Table Partitioning) is the division of a single logical database table into smaller physical tables (partitions) within the same database engine instance. It allows query execution engines to scan only relevant partitions (partition pruning) instead of scanning massive, multi-gigabyte tables.
*   **Scalability Dimension:** Primary: **Query Latency (P99)** & **Index Search Speed**. Secondary: **Storage Management / Archive Costs**.

---

## ⚖️ 2. Trade-offs & Deep Dive
| Partitioning Strategy | How it works | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **Range Partitioning** | Rows mapped by value range (e.g., date: `Jan-2026`). | Perfect for time-series data. Easy to drop old partitions. | Can lead to hot-spotting (current month receives all writes). |
| **List Partitioning** | Rows mapped by explicit list keys (e.g., region: `US`, `EU`). | Groups data logically for region-specific routing. | Adding new partition keys requires altering schema partitions. |
| **Hash Partitioning** | Partition index = `hash(key) % N`. | Spreads keys uniformly across all partitions. | Range queries are slow (requires scanning all partitions). |

*   **Ideal Use Cases:**
    *   Time-series databases, logs archives, or transactional ledgers spanning multiple years where old data is rarely queried.
*   **Anti-Patterns / When NOT to use:**
    *   Small database tables under 10-20 GB (adds partition management overhead without actual performance gains).

---

## 💥 3. Resiliency & Operations
*   **Observability (The "Signal"):**
    *   `Query Execution Path (EXPLAIN)`: Checking if queries prune partitions correctly or scan all partitions (un-pruned scan).
    *   `Partition Size growth imbalance`.
*   **Blast Radius (The "Impact"):**
    *   If partition creation scripts fail (e.g., a cron job failing to create the partition for the next month), writes to that date range will fail completely with insertion errors.

---

## 🚫 4. Interview Playbook
*   **Common Mistakes:**
    *   Confusing Database Partitioning (splitting tables inside one DB server instance) with [Database Sharding](04-Database-Sharding.md) (splitting tables across multiple physical DB server nodes).
    *   Not accounting for index partitioning (Local indices exist per partition; Global indices span the entire table, creating write bottlenecks).
*   **Interview Tip (The "Strong Hire" Signal):**
    *   Explain time-series optimization: *"We partition our events table by Range (Date). This allows us to perform **Partition Pruning** during queries, scanning only active dates, and trivially archive old years by executing a fast partition metadata drop instead of a slow, lock-heavy DELETE query."*

---

## 💡 5. My Custom Study Notes & Whiteboard
*Use this section to document your sketches, code blocks, or personal notes.*
