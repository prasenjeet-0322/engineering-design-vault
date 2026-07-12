# L002: MySQL

## 📖 Overview
### What is MySQL?
MySQL is the world's most popular open-source relational database management system. It serves as the bedrock for countless web applications (the "M" in LAMP stack) and is highly optimized for read-heavy transactional workloads, simple schema designs, and massive horizontal read-scaling.

### Core Capabilities
*   **High-Speed Reads:** Exceptionally fast at handling highly concurrent, simple primary-key lookups and read-heavy workloads.
*   **Pluggable Storage Engines:** Allows swapping the underlying storage engine (e.g., InnoDB for ACID compliance, MyISAM for fast read-only analytics).
*   **Ubiquity & Ecosystem:** Boasts massive community support, seamless integration with nearly every framework, and mature ORM compatibility.
*   **Read-Replication:** Natively excels at asynchronous replication, making it trivial to scale out read capacity globally.

## 📋 Tracker Metadata
| Column | Value / Status |
| :--- | :--- |
| **Category** | Database |
| **Type** |  |
| **Primary Use Case** |  |
| **Strengths** |  |
| **Weaknesses** |  |
| **Best For** | Web apps, read replicas |
| **Never Use When** | Global distribution |
| **Max Scale** |  |
| **Consistency Model** |  |
| **CAP Choice** | CA |
| **PACELC Profile** | PC/EL (Default, async replication), PC/EC (Synchronous replication. See [PACELC Theorem](../../../../10-Consistency-Models/04-PACELC-Theorem.md)) |
| **Understanding** | [🔴 None / 🟡 Conceptual / 🟢 Applied] |
| **Internals Known** | [ ] Yes / [ ] No |
| **Interview Ready** | [ ] Yes / [ ] No |
| **Used In Projects** | [ ] Yes / [ ] No |
| **Key Config Known** | [ ] Yes / [ ] No |
| **Comparison Known** | [ ] Yes / [ ] No |
| **Last Revised** | YYYY-MM-DD |
| **Next Review** | YYYY-MM-DD |
| **Mastery** | [🔴 Familiar / 🟡 Competent / 🟢 Expert] |

---

## ⚖️ Architectural Trade-offs & Deep Dive
1. **Thread-per-Connection:** MySQL creates a new OS thread for each client connection (unlike Postgres's process-per-connection). This makes connection handling slightly more lightweight natively but still requires a connection pooler at high scale.
2. **Read-Heavy Optimization:** InnoDB is heavily optimized for fast row lookups. If an application requires 90% reads and 10% writes, MySQL is often the default choice over Postgres.
3. **Pluggable Engines vs Monolithic:** MySQL's pluggable architecture means features are sometimes disjointed across engines. InnoDB provides ACID transactions, but older engines like MyISAM do not.
4. **Weaker Data Integrity by Default:** Historically, MySQL has been more forgiving with data types and silent truncations compared to PostgreSQL's strict, fail-fast type checking.
5. **Less Advanced Query Planner:** The query optimizer is simpler than Postgres. It struggles with highly complex, multi-table `JOIN`s, deep subqueries, and window functions compared to Postgres.
6. **MVCC Implementation:** InnoDB handles MVCC by keeping old row versions in an "Undo Log" rather than duplicating rows in the main table like Postgres. This prevents the "vacuuming" table bloat seen in Postgres but makes long-running transactions expensive as the Undo Log grows.
7. **Never Use When:** You require absolute mathematical strictness for financial ledgers, rely heavily on geospatial data (PostGIS is superior), or have massive analytical queries spanning millions of rows.

### 🚫 When NOT to Use (Anti-Patterns)
*(Detail the anti-patterns. What specific system constraints or access patterns make this technology the absolute wrong choice?)*

---

## ⚙️ Internal Architecture (The "Deep Dive")
### 1. Core Engine Mechanics
MySQL relies on a two-tier architecture: the SQL layer (parser, optimizer, query cache) and the Pluggable Storage Engine layer. **InnoDB** is the default and only recommended engine for modern apps, utilizing **B+Trees** for its clustered indexes. Because it uses a thread-per-connection model, high concurrency is managed efficiently by the OS thread scheduler. 

### 2. Storage & Persistence Layer
InnoDB uses **Clustered Indexes**, meaning the actual row data is stored *inside* the leaf nodes of the Primary Key B+Tree. Secondary indexes do not contain row data; they contain a pointer back to the Primary Key. Therefore, querying by a secondary index requires a "double lookup" (Secondary Index $\rightarrow$ PK Index $\rightarrow$ Row). Durability is guaranteed via the **Redo Log** (WAL equivalent), and MVCC is managed via the **Undo Log**.

### 3. Replication & Consensus
MySQL primarily utilizes **Asynchronous Replication** reading from the **Binlog** (Binary Log).
*   **Statement-Based:** Replicates the exact SQL query (fast, but non-deterministic functions like `NOW()` cause drift).
*   **Row-Based (Recommended):** Replicates the actual changed row data. Safer but consumes more network bandwidth.
*   **Group Replication / InnoDB Cluster:** A newer Paxos-based consensus protocol providing high availability and multi-master capabilities, moving away from legacy async replication.

---

## 📐 Standard Whiteboard Patterns
### 1. Common Integration Architecture
*   **The Classic Read-Heavy Web App:** A single Primary Master handles all `INSERT/UPDATE` traffic. 3-5 Read Replicas sit behind an Application Load Balancer to handle 100% of the `SELECT` traffic.
*   **Sharding via Application Logic:** When horizontal write-scaling is required, the application hashes the `user_id` to route the query to one of dozens of independent MySQL shards (e.g., Vitess architecture).

### 2. Failure Modes & Blast Radius
If the Primary Master dies, writes fail immediately. A secondary must be promoted to Master. Because default replication is asynchronous, any transactions committed to the Master that were not yet streamed to the Replica *will be permanently lost* during the failover ("Phantom Reads").

---

## 🛠️ Critical Configurations & Tuning
### 1. Consistency vs. Latency Flags
*   `innodb_flush_log_at_trx_commit`: 
    *   `1` (Default): ACID compliant. Flushes Redo Log to disk on every commit. Safe but slow.
    *   `2`: Writes to OS cache on commit, flushes to disk once per second. Extremely fast, but a server crash loses up to 1 second of transactions.
*   `sync_binlog`: Controls how often the binary log is synchronized to disk. Setting to `1` is safest for replication integrity.

### 2. Eviction & Memory Management
*   `innodb_buffer_pool_size`: The most critical tuning parameter in MySQL. It caches both data and indexes in RAM. Should be set to 70-80% of total dedicated server memory. If this is too small, MySQL becomes disk-I/O bound and grinds to a halt.

### 3. Connection & Thread Pools
*   `max_connections`: Default is usually 151, which is too low for modern microservices. Can be safely bumped to 1000-2000 depending on RAM. 
*   **ProxySQL:** Used as an intelligent Layer 7 proxy to pool connections, route read/write queries to the correct master/replica, and cache frequent identical queries.

---

---

## 💰 Cost & Operational Overhead
*(Detail the TCO and DevOps burden. e.g., Requires a dedicated 3-person team to manage ZooKeeper, or fully managed but expensive per API call).*

## 🥊 Direct Competitors & Alternatives
*(Quick 1-to-1 comparisons. e.g., Cassandra vs. DynamoDB, or Redis vs. Memcached).*

## 📊 Benchmarking & True Scale Constraints
*(Actual numbers. e.g., "Saturates at 30k RPS per node", or "Degrades heavily past 5TB per shard").*

## 🔒 Security & Compliance
*(Enterprise capabilities. e.g., At-rest encryption support, RBAC, IAM integration).*

## 💼 Production Experience
### 1. Real-World Use Case
*(Add your specific experience here. Example: "Managed the primary user-profile datastore utilizing a Master-Slave topology, routing all authentication reads to the replicas to survive 10k RPS traffic spikes.")*

### 2. Lessons Learned (Gotchas)
*(Add your specific lessons here. Example: "Discovered that adding a secondary index to a massive table locked the table for 45 minutes in older MySQL versions, causing a complete production outage. Learned to use `pt-online-schema-change`.")*
