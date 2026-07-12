## 📖 Overview
### What is MongoDB?
MongoDB is the leading NoSQL Document Database. It stores data in flexible, JSON-like documents (BSON), meaning fields can vary from document to document and data structure can be changed over time.

### Core Capabilities
*   **Flexible Schema:** Allows storing polymorphic data (e.g., a product catalog where a "TV" has screen size, but a "Shirt" has fabric type) without millions of null columns.
*   **Expressive Querying:** Unlike basic Key-Value stores, Mongo allows deep querying, indexing, and aggregations on nested JSON arrays and sub-documents.
*   **Horizontal Sharding:** Natively designed to distribute massive collections across multiple physical servers.

## 📋 Tracker Metadata
| Column | Value / Status |
| :--- | :--- |
| **Category** | Database |
| **Type** | NoSQL Document |
| **Primary Use Case** | Polymorphic Catalogs, CMS |
| **Strengths** | Schema flexibility, expressive query language |
| **Weaknesses** | Memory hungry, joining data is slow |
| **Best For** | Rapid agile dev, unstructured JSON data |
| **Never Use When** | Highly relational financial ledgers |
| **Max Scale** | Petabytes |
| **Consistency Model** | Strong (Primary) / Eventual (Secondaries) |
| **CAP Choice** | CP |
| **PACELC Profile** | PC/EL (Tunable to PC/EC via write concern `w:majority` / read preference `primary`. See [PACELC Theorem](../../../../10-Consistency-Models/04-PACELC-Theorem.md)) |
| **Understanding** | [ ] None / [ ] Conceptual / [x] Applied |
| **Internals Known** | [x] Yes / [ ] No |
| **Interview Ready** | [x] Yes / [ ] No |
| **Used In Projects** | [x] Yes / [ ] No |
| **Key Config Known** | [x] Yes / [ ] No |
| **Comparison Known** | [x] Yes / [ ] No |
| **Last Revised** | YYYY-MM-DD |
| **Next Review** | YYYY-MM-DD |
| **Mastery** | [ ] Familiar / [x] Competent / [ ] Expert |

---

## ⚖️ Architectural Trade-offs & Deep Dive
1. **Schema-on-Read vs Schema-on-Write:** Mongo validates data at the application layer, allowing rapid iteration, but risks data corruption if developers write bugs.
2. **Denormalization Focus:** Because `$lookup` (JOIN) is highly inefficient, data that is accessed together must be stored together (embedded documents).
3. **BSON Limits:** A single document cannot exceed 16MB. If storing massive arrays (e.g., millions of IoT readings in one doc), the architecture will fail.
4. **WiredTiger Engine:** Uses document-level concurrency control (locks), allowing massive write throughput compared to its old MMAPv1 engine.
5. **Replica Sets:** Requires a minimum of 3 nodes (Primary-Secondary-Secondary/Arbiter) to maintain quorum.
6. **Multi-Document ACID:** As of v4.0, Mongo supports multi-document ACID transactions, but they are expensive and heavily discouraged for high-throughput paths.
7. **Never Use When:** Your data inherently resembles a highly interconnected graph (use Neo4j), or requires hundreds of rigid relational tables (use Postgres).

### 🚫 When NOT to Use (Anti-Patterns)
*(Do not use Mongo as a pure Key-Value store; it is too heavy. Do not use it for applications requiring massive, multi-table cross-joins.)*

---

## ⚙️ Internal Architecture (The "Deep Dive")
### 1. Core Engine Mechanics
Uses the **WiredTiger** storage engine, utilizing B-Trees for indexes. It relies heavily on an internal memory cache (defaulting to 50% of system RAM minus 1GB) to hold the working set uncompressed, while compressing data on disk.

### 2. Storage & Persistence Layer
Data is serialized into BSON (Binary JSON). Changes are written to an in-memory buffer and appended to the **Journal** (similar to WAL) for durability before being asynchronously flushed to data files on disk.

### 3. Replication & Consensus
Uses **Replica Sets** driven by an internal implementation of the Raft consensus algorithm. Only the Primary accepts writes; Secondaries replicate the **Oplog** (Operations Log). If the Primary dies, an election is held based on voting nodes to promote a new Primary.

---

## 📐 Standard Whiteboard Patterns
### 1. Common Integration Architecture
**The Sharded Cluster:** Applications connect to `mongos` (routers). The router checks the `Config Servers` to find which `Shard` (Replica Set) holds the requested document based on the Shard Key, and routes the query.

### 2. Failure Modes & Blast Radius
During an election (Primary failure), the replica set blocks all writes for a few seconds. If a Shard Key is chosen poorly (e.g., monotonically increasing timestamp), all writes route to a single "hot" shard, entirely neutralizing horizontal scaling.

---

## 🛠️ Critical Configurations & Tuning
### 1. Consistency vs. Latency Flags
*   `Write Concern (w)`: `w: 1` acknowledges fast but risks loss. `w: majority` ensures the write hit the majority of nodes (safe).
*   `Read Preference`: `primary` (strong consistency), `secondary` (eventual consistency, offloads reads).

### 2. Eviction & Memory Management
*   `wiredTigerCacheSizeGB`: Limits the internal cache. If your working set exceeds this, Mongo swaps to disk and performance crashes dramatically.

### 3. Connection & Thread Pools
*   `maxPoolSize`: Handled at the application driver level to prevent connection storms that exhaust the `mongos` router.

---

## 💰 Cost & Operational Overhead
Running a sharded cluster is operationally massive (requires minimum 2 mongos, 3 config servers, and 3 nodes per shard). Highly recommended to use MongoDB Atlas (fully managed) which gets very expensive at scale.

## 🥊 Direct Competitors & Alternatives
*   **MongoDB vs Couchbase:** Couchbase has a memory-first architecture making it faster for KV workloads, but Mongo has a vastly superior developer ecosystem and query language.
*   **MongoDB vs DynamoDB:** DynamoDB has zero operational overhead but rigid access patterns; Mongo allows dynamic ad-hoc querying.

## 📊 Benchmarking & True Scale Constraints
Easily handles 50k+ write RPS on a solid replica set. Sharding allows linear scaling to millions of operations per second, but requires a perfectly chosen Shard Key.

## 🔒 Security & Compliance
Supports Field-Level Encryption (CSFLE), allowing data to be encrypted before it even leaves the application server, making it extremely popular for Healthcare/FinTech compliance.

---

## 💼 Production Experience
### 1. Real-World Use Case
*(Example: "Built a dynamic CMS where content schemas varied wildly between articles, videos, and galleries, embedding comments directly inside the article document to achieve 1-read page loads.")*

### 2. Lessons Learned (Gotchas)
*(Example: "Designed an array of `followers` inside a User document. A celebrity joined, the array exceeded the 16MB document limit, and writes permanently crashed for that user.")*
