# ⚡ 02 - Database Indexing

## 📋 Tracker Metadata
| Column | Value / Status |
| :--- | :--- |
| **Concept ID** | C032 |
| **Category** | Core Databases |
| **Difficulty** | 🟢 Easy |
| **Interview Frequency** | 🔥 High |
| **Understanding** | [🔴 None / 🟡 Conceptual / 🟢 Applied] |
| **Can Explain** | [ ] Yes / [ ] No |
| **Whiteboard Drawn** | [ ] Yes / [ ] No |
| **Taught Someone** | [ ] Yes / [ ] No |
| **Next Review** | YYYY-MM-DD |
| **Mastery** | [🔴 Familiar / 🟡 Competent / 🟢 Expert] |

---

## ⚡ 1. The Core Definition & Trigger
*   **Two-Sentence Trigger:** Database Indexing is the creation of auxiliary data structures (such as B-Trees or Hash tables) on database columns to speed up data retrieval. While indices reduce read time from $O(N)$ sequential table scans to $O(\log N)$ tree lookups, they introduce write amplification and consume storage.
*   **Scalability Dimension:** Primary: **Read Latency** & **Query Throughput**. Secondary: **Write Latency Degradation**.

---

## ⚖️ 2. Trade-offs & Deep Dive
| Index Type | Internal Structure | Best For | Trade-off | Found In |
| :--- | :--- | :--- | :--- | :--- |
| **B+Tree** | Self-balancing tree. Keys only in internal nodes; data/pointers in leaves linked sequentially. | Range queries, exact matches, sorting. | Read-optimized. High write penalty (page splits). | [PostgreSQL](../24-components-library/01-Databases/SQL/L001-PostgreSQL/README.md), [MySQL](../24-components-library/01-Databases/SQL/L002-MySQL/README.md) |
| **LSM-Tree** | MemTable in RAM, immutable SSTables on disk. Sorted via background Compaction. | Massive write velocity, append-only logs. | Write-optimized. Slower reads due to scanning multiple SSTables. | [Cassandra](../24-components-library/01-Databases/NoSQL_WideColumn/L004-Cassandra/README.md), [DynamoDB](../24-components-library/01-Databases/NoSQL_WideColumn/L005-DynamoDB/README.md) |
| **Hash Index** | Hash function maps key to specific memory bucket. | Ultra-fast exact match lookups (`=`). | Cannot perform range queries (`<`, `>`) or sorting. | [Redis](../24-components-library/01-Databases/NoSQL_KV/L006-Redis/README.md) |
| **Inverted Index (GIN)** | Maps terms/words to a list of Document IDs. | Full-text search, JSONB document querying. | Extremely high write amplification on update. | [Elasticsearch](../24-components-library/09-Search_Engines/L007-Elasticsearch/README.md) |
| **Geospatial (R-Tree / Grids)** | Bounding boxes (R-Tree) or 1D-mapped space curves (Geohash, Google S2 Cells). | Finding nearby points (e.g., Uber matching). | Complex coordinates projection and overlaps. | [PostGIS](../24-components-library/01-Databases/Geospatial/L067-PostGIS/README.md) |

---

## 🧠 3. Advanced Indexing Concepts (SDE-3 Level)

### 1. Clustered vs Non-Clustered Indexes
*   **Clustered:** The physical data rows are stored *inside* the leaf nodes of the index. A table can only have **one** clustered index (usually the Primary Key). Lookups are extremely fast because the data is contiguous on disk.
*   **Non-Clustered (Secondary):** The leaf node contains a *pointer* (or a copy of the Primary Key) referencing the actual data row. Querying requires a **Double Lookup**: traverse the secondary index $\rightarrow$ find the PK $\rightarrow$ traverse the clustered index to fetch the row.

### 2. The "Covering Index" (Index-Only Scan)
If a query `SELECT name FROM users WHERE id = 5` is executed, and both `id` and `name` are present in the index itself, the database can return the result *without ever hitting the disk to read the actual table row*. This is the holy grail of read optimization.

### 3. Composite Indexes & The Left-Prefix Rule
If you create an index on `(last_name, first_name)`:
*   `WHERE last_name = 'Smith'` $\rightarrow$ **Uses Index**
*   `WHERE last_name = 'Smith' AND first_name = 'John'` $\rightarrow$ **Uses Index**
*   `WHERE first_name = 'John'` $\rightarrow$ **Full Table Scan (Fails!)**
*   *Rule:* Composite indexes only work if you query from left-to-right without skipping columns.

### 4. Bloom Filters (LSM-Tree Secret Weapon)
Because LSM-Trees (Cassandra, [RocksDB](../24-components-library/01-Databases/Embedded/L068-RocksDB/README.md)) must check multiple disk files (SSTables) for a read, they use Bloom Filters in memory. A Bloom filter can answer "Is this key in this file?" with "Definitely No" or "Probably Yes." This prevents unnecessary disk reads.

### 5. Partial / Filtered Indexes
Instead of indexing the entire table, a partial index contains entries only for rows that satisfy a specific conditional predicate (e.g., `CREATE INDEX ON jobs (created_at) WHERE status = 'PENDING'`). This dramatically reduces index size, update overhead, and write amplification for inactive/completed data (ideal for job queues).

### 6. Expression / Functional Indexes
Built on the output of an expression or function rather than direct column values (e.g., `CREATE INDEX ON users (LOWER(email))`). Without this, running `WHERE LOWER(email) = 'abc'` forces a full table scan because standard column indexes are case-sensitive and match the raw values.

### 7. Selectivity & Cardinality Math
Selectivity is a primary metric query plan optimizers use to decide if they should scan an index or do a full table scan:
$$\text{Selectivity} = \frac{\text{Number of Unique Values}}{\text{Total Number of Rows}}$$
*   **High Selectivity (Close to 1):** Unique identifiers, emails. Perfect for indexing.
*   **Low Selectivity (Close to 0):** Enums (e.g., gender, status). Indexing these is an anti-pattern. Random disk seeks to fetch scattered pages for 50% of the table is slower than a sequential heap scan.

### 8. B-Tree vs. B+Tree Structural Differences
Relational engines (Postgres, MySQL/InnoDB) default to B+Trees rather than standard B-Trees:
*   **B-Tree:** Stores keys and data/pointers at all levels (internal and leaf nodes).
*   **B+Tree:** Stores data/pointers *only* at the leaf level. Internal nodes only store routing keys. This allows internal nodes to fit more keys, increasing the branching factor (fan-out) and reducing tree height. Leaves are linked sequentially (doubly-linked list), enabling $O(1)$ range scans instead of slow tree traversals.

### 9. Column Order in Composite Indexes (The Range Trap)
When constructing composite indexes like `(A, B)`, if the query applies an inequality/range to the first column (`WHERE A > 10 AND B = 5`), the sorting on `B` is broken past the first inequality match. The engine must scan all entries matching `A > 10` to filter `B`.
*   *Design Rule:* Place exact match (`=`) columns *first* in composite declarations, and range filter (`>`, `<`, `LIKE`) columns *last*.

### 10. LSM-Tree Compaction & Write Amplification
LSM-trees write sequentially to RAM (MemTable) and flush immutably to disk (SSTables). To keep reads fast and remove deleted keys (tombstones), a background process called **Compaction** continuously merges and sorts SSTables (Size-Tiered or Leveled). This incurs high write amplification (re-writing the same data multiple times to disk), trading background IO/CPU for constant-time sequential write latency.

---

## 💥 4. Resiliency & Operations
*   **Observability (The "Signal"):**
    *   `Sequential Scan vs Index Scan Ratio`: High sequential scan counts on large tables indicate missing indices.
    *   `Write Amplification Factor`: Spikes in DB write IOPs relative to application updates indicate too many indices on a table.
*   **Blast Radius (The "Impact"):**
    *   Adding an index on a multi-million-row production table blocks writes and locks tables if not run concurrently (e.g., using `CREATE INDEX CONCURRENTLY` in Postgres).

---

## 🚫 5. Interview Playbook
*   **Common Mistakes:**
    *   Indexing every column in a table thinking it makes the DB faster. *Reality: Every index heavily penalizes `INSERT`/`UPDATE` speed because multiple data structures must be modified synchronously.*
    *   Adding an index on low-selectivity columns (e.g., a boolean `is_active`). If the query returns 50% of the table, a sequential scan is actually faster than traversing a B-Tree and fetching scattered disk pages.
*   **Interview Tip (The "Strong Hire" Signal):**
    *   State: *"To optimize read latency for this microservice, I will introduce a composite covering index. However, I must be mindful of the write amplification this introduces. During rollout, I will ensure we use a concurrent index build to avoid acquiring a Write Lock on the production table."*

---

## 💡 6. My Custom Study Notes & Whiteboard
*Use this section to document your sketches, code blocks, or personal notes.*
