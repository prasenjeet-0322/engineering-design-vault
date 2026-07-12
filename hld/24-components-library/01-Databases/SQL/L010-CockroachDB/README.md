# L010: CockroachDB

## 📖 Overview
### What is this component?
CockroachDB is an open-source, cloud-native, horizontally scalable SQL database designed for high availability and strong consistency (NewSQL). It is designed to survive machine, rack, or datacenter failures with zero data loss and no manual intervention, utilizing Raft consensus for replication instead of proprietary hardware clocks.

### Core Capabilities
*   **Distributed SQL Engine:** Natively speaks the PostgreSQL wire protocol, allowing drop-in compatibility with standard PostgreSQL client drivers.
*   **Serializable ACID Transactions:** Enforces Serializable isolation (the highest SQL transaction isolation level) globally by default, eliminating race conditions.
*   **Multi-Active Availability:** Multi-master architecture where any node can accept read/write requests, distributing the load uniformly.
*   **Geo-Partitioning (Locality-Aware Routing):** Allows pinning table rows to specific physical regions (e.g., pinning EU user data to EU servers) via simple SQL DDL, complying with data residency laws (GDPR) and reducing latency.

## 📋 Tracker Metadata
| Column | Value / Status |
| :--- | :--- |
| **Category** | Database |
| **Type** | NewSQL / Distributed Relational |
| **Primary Use Case** | Geo-distributed Transactional Ledgers, Multi-Region SaaS |
| **Strengths** | Serializable transactions, Postgres compatibility, zero lock-in |
| **Weaknesses** | High memory usage, write restart retries under contention |
| **Best For** | Global SQL, geo-distributed |
| **Never Use When** | Low latency local workloads (single-node), or pure OLAP |
| **Max Scale** | Petabytes |
| **Consistency Model** | External Consistency (Linearizability) |
| **CAP Choice** | CP |
| **PACELC Profile** | PC/EC (See [PACELC Theorem](../../../../10-Consistency-Models/04-PACELC-Theorem.md)) |
| **Understanding** | [🔴 None / 🟡 Conceptual / 🟢 Applied] |
| **Internals Known** | [x] Yes / [ ] No |
| **Interview Ready** | [x] Yes / [ ] No |
| **Used In Projects** | [x] Yes / [ ] No |
| **Key Config Known** | [x] Yes / [ ] No |
| **Comparison Known** | [x] Yes / [ ] No |
| **Last Revised** | 2026-06-22 |
| **Next Review** | 2026-09-22 |
| **Mastery** | [🔴 Familiar / 🟡 Competent / 🟢 Expert] |

---

## ⚖️ Architectural Trade-offs & Deep Dive

1. **Serializable Isolation by Default vs. Transaction Latency:** Enforces Serializable isolation. It handles conflicts using Multi-Version Concurrency Control (MVCC) combined with transactional retries (write restarts). Under high write contention on the same keys, transactions will fail and require the application to retry, trading execution latency for absolute transaction safety.
2. **Logical Hybrid Logical Clocks (HLC) vs. Physical TrueTime Hardware:** Unlike Spanner which requires GPS/atomic clocks, CockroachDB uses **Hybrid Logical Clocks (HLC)**. HLC combines physical NTP-synchronized clock times with logical causal counters to order events. While highly flexible (runs anywhere), it is vulnerable to NTP clock skew. If the offset between node clocks exceeds a configured threshold (usually $500\text{ms}$), the affected node automatically panics and shuts down to prevent consistency anomalies.
3. **Raft Consensus Replication vs. Disk Overhead:** Data is split into $64\text{MB}$ key-value ranges. Each range is replicated across a **Raft group** (usually 3 or 5 replicas). Writes must write to a quorum of Raft nodes (2 out of 3, or 3 out of 5) and be appended to their Write-Ahead Log (WAL) before returning. This guarantees survivability but increases disk write I/O and network egress.
4. **PostgreSQL Compatibility vs. Performance Optimization:** CockroachDB emulates PostgreSQL but is written in Go and uses a completely custom distributed SQL execution engine. Some PostgreSQL features (like heavy recursive CTEs, triggers, or specific store procedures) are slow or unsupported because they cannot be executed concurrently across different nodes without huge network overhead.
5. **Auto-Rebalancing (Ranges) vs. CPU Jitter:** The database dynamically splits and merges $64\text{MB}$ ranges based on size and load. During high-traffic spikes, background range splits and replica movements consume CPU and disk I/O, causing P99 latency spikes (jitter).
6. **Locality-Aware Routing (Geo-Partitioning) vs. Regional Autonomy:** CockroachDB allows pinning table rows to specific regions (e.g. `REGIONAL BY ROW`). This makes local operations fast ($\approx 2\text{ms}$) but makes global aggregates or cross-region joins extremely slow as data must travel across WAN links.
7. **Key-Value Store (Pebble/RocksDB) vs. B+Tree Storage:** Unlike standard relational databases that write directly to relational block files, CockroachDB translates SQL tables into key-value pairs stored in **Pebble** (a Go-based LSM storage engine). LSM engines are excellent for writes but suffer from compaction overhead and read amplification compared to B+Trees.

### 🚫 When NOT to Use (Anti-Patterns)
*   **Ultra-Low Latency Single-Node Applications:** CockroachDB is designed to run in a clustered environment. If deployed on a single server, the overhead of the SQL translation layer, Pebble LSM engine, and internal Raft loops will perform significantly slower than a standard PostgreSQL instance.
*   **Heavy OLAP/Data Warehousing:** Do not run heavy analytical queries with massive range scans. It will saturate the Go garbage collector and CPU resources. Use Google BigQuery or ClickHouse instead.
*   **High Write Contention on Single Rows:** Hot-spot rows (like a global counter) will cause high transaction retries (Serialization failures), degrading overall write throughput.

---

## ⚙️ Internal Architecture (The "Deep Dive")
### 1. Core Engine Mechanics (SQL to KV Mapping)
CockroachDB translates SQL structured tables into sorted key-value pairs:
*   Every SQL row is serialized into one or more key-value pairs.
*   **Key Encoding:** Encodes the Table ID, Index ID, and Primary Key values.
*   **Value Encoding:** Encodes the remaining column values of the row.
*   The KV engine is **Pebble** (a LSM storage engine written in Go, derived from RocksDB).

### 2. Storage & Persistence Layer
*   Data is partitioned into $64\text{MB}$ contiguous key ranges called **Ranges**.
*   Each range is replicated across a **Raft group** (see [Raft Consensus](../../../../20-Distributed-Consensus/10-Raft-Consensus.md)).
*   The Raft group elects a **Leaseholder** (often the Raft Leader). The Leaseholder handles all reads and writes for that range, entirely bypassing the Raft network consensus round-trip for read operations.

### 3. Replication & Consensus (HLC Mechanics)
*   **Hybrid Logical Clock (HLC):** Combines physical NTP clock readings with logical counters. If Node A has physical time $t_A$, and receives an event from Node B with timestamp $t_B$, HLC ensures Node A's logical clock increments beyond $t_B$, establishing a causal "happens-before" relationship:
    $$l_{new} = \max(l_{old}, t_{physical}, t_{received}) + 1$$
*   **NTP Offset Protection (`--max-offset`):** Because NTP can drift, CockroachDB enforces a maximum allowed physical clock offset. If Node A's physical clock drifts past the offset threshold relative to its peers, the node self-terminates to prevent transaction serialization violations.

---

## 📐 Standard Whiteboard Patterns
### 1. Common Integration Architecture
```
                                        ┌──► Range 1 [64MB] (Leaseholder) ──► Pebble
                                        │
Client ──► [LB] ──► [Any Node (Gateway)]─┼──► Range 2 [64MB] (Follower)
                                        │
                                        └──► Range 3 [64MB] (Follower)
```
*   Clients connect to any node via standard PostgreSQL JDBC/ODBC drivers.
*   The node acting as the Gateway parses the query, hashes the key to locate the target $64\text{MB}$ Range, and routes the query directly to the Leaseholder.

### 2. Failure Modes & Blast Radius
*   **Node Outage:** If a node hosting several range leaseholders dies, the remaining Raft replicas detect the heartbeat loss and automatically elect new leaseholders (typically $< 9\text{s}$). Read/write queries for those ranges are briefly retried in the gateway node, resulting in zero client-facing errors.
*   **NTP Desynchronization:** If NTP synchronization fails on a server node, the node panics and shuts down. The blast radius is isolated; the remaining nodes in the cluster detect the node's offline state and rebalance its ranges.

---

## 🛠️ Critical Configurations & Tuning
### 1. Clock Sync Offset Sizing
*   `--max-offset`: Defines the NTP clock skew panic limit. Default is $500\text{ms}$. In virtualized environments (like AWS/GCP), this should be tuned down to $100\text{ms}$ or lower if utilizing high-speed local time sync tools (like Chrony) to minimize transaction restart rates.

### 2. Connection Pooling
*   Since CockroachDB runs on a Go runtime, it manages connections via goroutines, which are cheaper than PostgreSQL processes. However, you must still place a load balancer (HAProxy) or connection pooler in front of the cluster to balance connections across all nodes evenly.

### 3. Transaction Retry Handling
Applications MUST handle transaction retry errors (`40001` or `SerializationFailure`) in their database client driver wrapper:
```go
// Example Go transaction retry block
err := db.RunInTransaction(context.Background(), func(tx *sql.Tx) error {
    _, err := tx.Exec("UPDATE accounts SET balance = balance - 10 WHERE id = 1")
    return err
})
```

---

## 💰 Cost & Operational Overhead
*   **Operational Burden:** Moderate. Considerably lower than Spanner because it does not require Google Cloud proprietary hardware and runs natively on Kubernetes (via the Cockroach Operator) or bare metal.
*   **Fully Managed Option:** CockroachDB Dedicated is available as a serverless or dedicated managed service.

## 🥊 Direct Competitors & Alternatives
*   **CockroachDB vs. Google Spanner:** Spanner uses hardware GPS/Atomic clocks, reducing write latency overhead, but is GCP-locked. CockroachDB runs on any environment using HLCs.
*   **CockroachDB vs. YugabyteDB:** YugabyteDB is built by modifying the actual PostgreSQL C-code parser, making it more compatible with advanced Postgres syntax, while CockroachDB is a custom Go rewrite.

## 📊 Benchmarking & True Scale Constraints
CockroachDB scales linearly to millions of QPS. Individual range leaseholders can become bottlenecks if queries do not filter on the partition key, causing scatter-gather range scans across all nodes.

## 🔒 Security & Compliance
*   **mTLS Encryption:** All inter-node communication is encrypted using mutual TLS certificates.
*   **GDPR Compliance:** Geo-partitioning natively satisfies regional data sovereignty requirements by keeping user data locked within specific physical countries.

## 💼 Production Experience
### 1. Real-World Use Case
CockroachDB is heavily used in global SaaS platforms and digital banking cores (like Starling Bank) to handle multi-region transaction ledgers with five-9s availability.

### 2. Lessons Learned (Gotchas)
*   *Gotcha:* Running high-throughput updates without handling the PostgreSQL `40001` retry code in the application code wrapper, which caused transaction failures to crash background queue processes instead of retrying them. Resolved by implementing an exponential backoff retry middleware in the API layer.
