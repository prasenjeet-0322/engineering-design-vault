# ⚡ Elasticsearch Architecture & System Design Deep Dive

| Field | Value |
|---|---|
| **Concept ID** | C115 |
| **Category** | Search Engines & Specialized Storage |
| **Difficulty** | 🔥 Hard |
| **Target Roles** | Mid-Level, Senior (SDE-2/3), Staff System Architects |
| **Interview Frequency** | 🌟 Top Tier (Google, Meta, Amazon, Uber, Airbnb, Stripe) |

---

## 🧭 Executive Overview

Elasticsearch is an open-source, distributed JSON document store and search engine built on top of **Apache Lucene**. It is the industry standard for sub-second **full-text search, faceted filtering, fuzzy matching, and real-time log analytics (ELK stack)**.

In system design interviews (e.g. *Design Amazon Product Search, Facebook Post Search, or Logstash Log Analytics*), senior candidates must demonstrate deep knowledge of the **Inverted Index, BM25 scoring, Near Real-Time (NRT) ingestion, Translog flushing, and Query vs Filter optimizations**.

---

## 1. ⚙️ Core Architecture & The Inverted Index

```
                           THE INVERTED INDEX ARCHITECTURE
                           
  Doc 1: "The quick brown fox"
  Doc 2: "Quick fox jumps"
                           │
                           ▼ (Analyzer: Lowercase + Tokenize)
  ┌──────────────────────┬────────────────────────────────────────────────────────┐
  │ Term (Vocabulary)    │ Postings List (Doc ID + Term Frequency + Positions)    │
  ├──────────────────────┼────────────────────────────────────────────────────────┤
  │ "brown"              │ [Doc 1 (tf: 1, pos: [2])]                              │
  │ "fox"                │ [Doc 1 (tf: 1, pos: [3])], [Doc 2 (tf: 1, pos: [1])]   │
  │ "jump"               │ [Doc 2 (tf: 1, pos: [2])]                              │
  │ "quick"              │ [Doc 1 (tf: 1, pos: [1])], [Doc 2 (tf: 1, pos: [0])]   │
  └──────────────────────┴────────────────────────────────────────────────────────┘
```

### 1.1 Text vs. Keyword Field Types
* **`text` Fields:** Passed through an **Analyzer Pipeline** (Character Filters $\rightarrow$ Tokenizer $\rightarrow$ Token Filters) to produce normalized tokens (stemming `running -> run`, lowercasing, stop-word removal). Used for **full-text relevance search**.
* **`keyword` Fields:** Stored verbatim without analysis. Used for **exact matching, filtering, sorting, and aggregations** (e.g., `status: "ACTIVE"`, `category_id: "CAT_991"`).

---

### 1.2 Cluster Node Roles & Topology

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  ELASTICSEARCH CLUSTER                                                                 │
│                                                                                        │
│  [ Coordinating Node ] ── (Receives Client REST Query / Scatters & Gathers)            │
│          │                                                                             │
│          ├───────────────────────────────┬────────────────────────────────┐            │
│          ▼                               ▼                                ▼            │
│  [ Master-Eligible Node ]        [ Data Node 1 ]                  [ Data Node 2 ]      │
│  - Cluster State Management      - Primary Shard 0 (P0)           - Primary Shard 1 (P1│
│  - Shard Allocation Decisions    - Replica Shard 1 (R1)           - Replica Shard 0 (R0│
│  - Quorum Master Election        - Inverted Index & Lucene Segments                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

* **Coordinating Node:** Routes client requests, broadcasts queries to relevant data shards, aggregates/sorts the results, and returns the final JSON response.
* **Master-Eligible Nodes:** Maintains cluster metadata and index routing tables. Uses a quorum election (`(N / 2) + 1`) to prevent **Split-Brain** anomalies.
* **Data Nodes:** Host Lucene index shards and execute search, filter, and aggregation computation.

---

## 2. ⚡ Data Ingestion, Durability & Near Real-Time (NRT) Search

Why is Elasticsearch called **Near Real-Time (NRT)**? A document is not searchable immediately upon ingestion, but rather after a periodic **Refresh** interval (default $1\text{ second}$).

```
                           DOCUMENT INGESTION & DURABILITY FLOW
                           
  Client POST /_doc ──► [ In-Memory Indexing Buffer ] ──► [ Translog (Write-Ahead Log) ]
                                    │                                    │ (Disk Append)
                                    │ (Refresh every 1s)                 ▼
                                    ▼                            (Durability Guarantee)
                         [ OS Page Cache (RAM) ]
                         (New Lucene Segment File)
                                    │
                                    ▼
                         SEARCHABLE! (Near Real-Time ✅)
                                    │
                                    │ (Flush every 30m or Translog > 512MB)
                                    ▼
                         [ Disk Storage (fsync) ]
                         (Permanent Immutable Segment on Disk)
```

### The 3 Core Stages:
1. **Refresh (`refresh_interval = 1s`):**  
   Memory buffer writes new immutable **Lucene Segments** directly into the **OS Page Cache**. The segment becomes visible to search queries *without* a disk `fsync`.
2. **Translog (Transaction Log):**  
   To prevent data loss if a node crashes before disk `fsync`, every write appends to the sequential Translog on disk.
3. **Flush (Commit to Disk):**  
   Every 30 minutes (or when Translog exceeds 512MB), segments in Page Cache are `fsync`'d to persistent disk, and the Translog is cleared.
4. **Segment Merging:**  
   Background worker threads merge multiple small immutable segments into larger segments and permanently purge documents marked as deleted in `.del` tombstone files.

---

## 3. 🔍 Query DSL: Scoring & Filter Optimizations

### 3.1 BM25 Scoring Algorithm
Elasticsearch calculates document relevance using **Okapi BM25** (an advancement over standard TF-IDF):

$$\text{Score}(D, Q) = \sum_{i=1}^{N} \text{IDF}(q_i) \cdot \frac{\text{TF}(q_i, D) \cdot (k_1 + 1)}{\text{TF}(q_i, D) + k_1 \cdot \left(1 - b + b \cdot \frac{|D|}{\text{avgdl}}\right)}$$

* **Term Frequency (TF) Saturation:** Diminishing returns for repeated terms (a document with 20 mentions of "shoes" isn't 20x more relevant than one with 5).
* **Inverse Document Frequency (IDF):** Rare words (e.g. "Mechanical") carry significantly higher score weight than common words (e.g. "The").
* **Field-Length Normalization:** Matches in short fields (e.g., Title) receive higher relevance than matches in long fields (e.g., Description).

---

### 3.2 🚀 Senior Optimization: Query Context vs. Filter Context

```javascript
// Production-Grade Search Query
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        // 1. QUERY CONTEXT: Calculates BM25 relevance score (Not cached in RAM)
        { "match": { "title": "running shoes" } }
      ],
      "filter": [
        // 2. FILTER CONTEXT: Exact Boolean match (YES/NO)
        // Bypasses score calculation & CACHED IN MEMORY BITSETS! 🚀
        { "term": { "status": "IN_STOCK" } },
        { "range": { "price": { "gte": 50, "lte": 150 } } },
        { "term": { "brand.keyword": "Nike" } }
      ]
    }
  }
}
```

> [!TIP]
> **Interview Pro-Tip:** Always put exact criteria (status, category, brand, price ranges) inside the **`filter`** clause. Filters skip expensive BM25 mathematical scoring and are automatically cached in JVM **Bitset memory** for microsecond execution.

---

### 3.3 Nested Objects vs. Flat Documents

```
Option A: Flat Documents (Fastest, High Denormalization)
  Store each review as an independent document referencing book_id.
  
Option B: Nested Mapping (Maintains Array Object Boundaries)
  Store reviews inside the parent Book document using `"type": "nested"`.
  (Best when queries must match multiple fields on the SAME nested object, e.g. rating >= 4 AND author = "Alice").
```

---

## 4. 🔄 Database to Elasticsearch Synchronization Architecture

> [!CAUTION]
> **The Dual-Write Anti-Pattern:**  
> Never have your application write to PostgreSQL and Elasticsearch in two consecutive network calls. If the second call fails, your search index becomes permanently out of sync.

### 💡 The Production Solution: Change Data Capture (CDC) with Debezium & Kafka

```mermaid
flowchart LR
    subgraph Primary Transaction
        API[App Service] -->|1. ACID Write| DB[(PostgreSQL)]
    end

    subgraph CDC Sync Pipeline
        DB -.->|2. Read WAL| Debezium[Debezium CDC]
        Debezium -->|3. Produce Event| Kafka((Kafka: "db-products"))
        Kafka -->|4. Consume & Bulk Index| ES_Sink[ES Sink Connector / Worker]
        ES_Sink -->|5. Bulk Indexing| ES[(Elasticsearch Cluster)]
    end
```

* **Why CDC?** Tailing the PostgreSQL Write-Ahead Log (WAL) guarantees **At-Least-Once event delivery** to Elasticsearch without adding read latency or lock contention to the transactional database.

---

## 5. 🚨 Shortcomings, Bottlenecks & Remediations

| Failure Mode | Root Cause | SDE-2 "Strong Hire" Mitigation |
|---|---|---|
| **Over-Sharding Crisis** | Creating hundreds of tiny (100MB) shards per index. Each shard consumes JVM heap for Lucene indices and file handles. | Follow the **20GB to 50GB per shard** golden rule. Use Index Lifecycle Management (ILM) to rollover indices based on size. |
| **Deep Pagination Crash** | Client queries `from: 10000, size: 20`. Every shard must fetch 10,020 records, and the coordinating node must sort $N \times 10020$ records in memory. | Disable deep pagination with `from + size`. Use **`search_after`** cursor-based pagination with a tie-breaker ID. |
| **High Update Write Amplification** | Lucene segments are immutable. Updating a document is an $O(1)$ soft-delete + full re-index, triggering massive segment merge CPU spikes. | Batch updates via `_bulk` API. For high-velocity mutable state (e.g. live stock count), keep mutable counters in Redis and search metadata in ES. |
| **JVM Garbage Collection Pauses** | Setting JVM Heap too large (> 32GB) or too small (< 8GB). | Cap Elasticsearch JVM Heap at **50% of physical RAM (Max 31GB)**. This preserves the remaining 50% RAM for OS Page Cache and maintains 32-bit **Compressed Oops** pointer efficiency. |

---

## 6. ⚖️ When to Use vs. When NOT to Use Elasticsearch

| Scenario | Recommendation | Rationale |
|---|---|---|
| **Full-Text Product / Content Search** | ✅ **Use Elasticsearch** | Inverted index + BM25 relevance scoring + typo tolerance. |
| **Faceted E-Commerce Search & Filtering** | ✅ **Use Elasticsearch** | Fast filter bitset caching and multi-dimensional aggregations. |
| **Log & Metric Aggregation (ELK)** | ✅ **Use Elasticsearch** | Time-based rolling indices with high-throughput ingestion. |
| **Primary System of Record / OLTP** | ❌ **Do NOT Use** | Not ACID compliant. Eventual consistency across shards. |
| **High-Frequency Single Row Updates** | ❌ **Do NOT Use** | Immutable Lucene segments make frequent single updates expensive. |
| **Simple Key-Value Lookups** | ❌ **Use Redis / DynamoDB** | Inverted index search adds unnecessary parsing and scoring overhead. |

---

## 7. 🎯 SDE-2 / Senior Interview Verbal Script Matrix

```
┌────────────────────────┬─────────────────────────────────────────────────────────────┐
│ Interview Topic        │ "Strong Hire" Verbal Answer                                 │
├────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Search Mechanics       │ "Elasticsearch leverages Apache Lucene's Inverted Index      │
│                        │  with an in-memory FST Term Index pointing to Term          │
│                        │  Dictionaries and Postings Lists on disk."                  │
├────────────────────────┼─────────────────────────────────────────────────────────────┤
│ NRT Search vs Flush    │ "Writes are Near-Real-Time because Refresh flushes memory to│
│                        │  OS Page Cache every 1s, making segments searchable before   │
│                        │  the 30-minute Translog disk fsync Flush occurs."           │
├────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Filter Optimization    │ "I isolate exact criteria inside the filter context to skip │
│                        │  BM25 score calculation and leverage memory-cached bitsets."│
├────────────────────────┼─────────────────────────────────────────────────────────────┤
│ DB Sync & Consistency  │ "To avoid Dual-Write race conditions, I stream database WAL │
│                        │  changes asynchronously using Debezium CDC and Kafka into   │
│                        │  Elasticsearch bulk indexing pipelines."                     │
├────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Deep Pagination        │ "I avoid 'from + size' deep pagination memory spikes by     │
│                        │  enforcing cursor-based pagination via search_after."       │
└────────────────────────┴─────────────────────────────────────────────────────────────┘
```
