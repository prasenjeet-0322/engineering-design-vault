# ⚡ 04 - Caching Mastery (C015-C031)

> **"There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton**

## 🧭 Caching & Database Optimization Study Path
Use this structured path aligned with your **Google Sheet Tracker** to deep dive into each caching concept:

### 🟢 1. Foundations & Topologies
*   [C015 - Cache Fundamentals](./01-Cache-Fundamentals.md)
*   [C023 - Distributed Cache](./02-Distributed-Cache.md)
*   [C024 - CDN (Content Delivery Network)](./03-CDN.md)

### 🟡 2. Read & Write Patterns
*   [C016 - Cache-Aside (Lazy Loading)](./04-Cache-Aside.md)
*   [C017 - Write-Through Cache](./05-Write-Through-Cache.md)
*   [C018 - Write-Behind Cache](./06-Write-Behind-Cache.md)
*   [C019 - Refresh-Ahead](./07-Refresh-Ahead.md)

### 🔴 3. Cache Eviction Policies
*   [C020 - Cache Eviction - TTL](./08-Cache-Eviction-TTL.md)
*   [C021 - Cache Eviction - LRU](./09-Cache-Eviction-LRU.md)
*   [C022 - Cache Eviction - LFU](./10-Cache-Eviction-LFU.md)

### 🟣 4. Failure Modes & Resiliency
*   [C025 - Cache Penetration](./11-Cache-Penetration.md)
*   [C026 - Cache Stampede](./12-Cache-Stampede.md)
*   [C027 - Cache Avalanche](./13-Cache-Avalanche.md)
*   [C028 - Cache Warming](./14-Cache-Warming.md)

### 🗄️ 5. Resource Optimization
*   [C029 - Connection Pooling](./15-Connection-Pooling.md)

### 🔬 6. Probabilistic Data Structures
*   [C030 - Bloom Filters](./16-Bloom-Filters.md)

### 🚀 7. In-Memory Store & Redis Architecture Deep Dive
*   [C031 - Redis Architecture & System Design Deep Dive](./17-Redis-Architecture-and-System-Design-Deep-Dive.md)

---

## 📖 1. The Foundations: Why Caching?
Caching is the process of storing data in a high-speed data storage layer (usually RAM) so that future requests for that data are served faster than is possible by accessing the data’s primary storage location (Disk/Database).

### The Key Metrics:
- **Cache Hit:** The data is found in the cache. (Latency: ~1ms).
- **Cache Miss:** The data is NOT found; we must fetch from the source. (Latency: ~100ms).
- **Cache Hit Ratio:** `Hits / (Hits + Misses)`. A "Strong Hire" candidate always mentions improving this ratio.

---

## 🗺️ 2. The 5 Layers of Caching (Where to cache?)

| Layer | Location | Tool | Purpose |
| :--- | :--- | :--- | :--- |
| **Client-Side** | Browser/App | Local Storage, IndexedDB | Prevents network calls entirely. |
| **Edge/CDN** | Global PoPs | Cloudflare, Akamai | Caches static assets (images/JS) near the user. |
| **Web/LB** | Nginx, Varnish | Nginx Proxy Cache | Caches full HTML pages or API responses. |
| **Application** | Local Memory | Guava, Caffeine | Caches DB query results inside the JVM. |
| **Database** | DB Memory | Buffer Pool, Query Cache | The DB's own internal optimization. |

---

## 🛠️ 3. The Top 3 Caching Tools

| Tool | Architecture | Key Strength | Best For |
| :--- | :--- | :--- | :--- |
| **Redis** | Single-threaded core, Rich Data Types, Persistent. | **Versatility**. Can be a Cache, DB, or Message Broker. | 99% of modern web applications. |
| **Memcached** | Multi-threaded, Simple Key-Value, No Persistence. | **Raw Speed & Simplicity**. Lower overhead for simple strings. | Massive, simple scaling (e.g., Facebook's early days). |
| **Hazelcast** | Distributed In-Memory Data Grid (IMDG). | **Clustering**. Automatic data sharding across JVMs. | Java-heavy enterprise systems, Real-time stream processing. |

---

## 🍎 Redis Deep Dive (The SDE-2+ Standard)

Redis is an in-memory, key-value store. Its power comes from its **Data Structures**, not just simple strings.

### 1. The 5 Core Data Types (Know These!)
- **Strings**: The basic K-V. Max 512MB. Used for session data, HTML fragments.
- **Lists**: Linked Lists of strings. Used for Activity Feeds or Simple Queues (`LPUSH`, `RPOP`).
- **Sets**: Unordered collection of unique strings. Used for "Unique Visitors" or "Friend Circles" (`SADD`, `SINTER`).
- **Hashes**: Maps between string fields and values. Used for representing **Objects** (e.g., User Profile).
- **Sorted Sets (ZSets)**: Sets where every member is associated with a score. Used for **Leaderboards** and **Rate Limiters**.

### 2. Persistence: RDB vs AOF
- **RDB (Snapshotting)**: Point-in-time snapshots of the dataset at specified intervals.
    - *Pro:* Compact, fast restarts. 
    - *Con:* Data loss between snapshots.
- **AOF (Append Only File)**: Logs every write operation received by the server.
    - *Pro:* Maximum durability (fsync every second). 
    - *Con:* Large files, slower restarts.
- **Senior Pro-Tip:** Use **Both**. RDB for backups/restarts, AOF for durability.

### 3. High Availability
- **Redis Sentinel**: Handles automatic failover. If the Master goes down, Sentinel promotes a Slave.
- **Redis Cluster**: Handles **Sharding**. Data is automatically split across multiple nodes using **Hash Slots**.

---

## 📉 Advanced Caching Failures (The "Strong Hire" Signals)

| Failure | The Scenario | The Solution |
| :--- | :--- | :--- |
| **Cache Penetration** | Requests for keys that **never exist** (e.g., ID: -1) hit the DB every time. | **Bloom Filters** or caching "Null" values with a short TTL. |
| **Cache Breakdown** | A **Hot Key** expires, and 10k requests slam the DB simultaneously. | **Mutex (Distributed Lock)** or "Probabilistic Early Expiration". |
| **Cache Snowslide** | **Many keys** expire at the exact same time (e.g., at midnight), crashing the DB. | **Jitter**: Add a random number of seconds to every TTL (e.g., 3600s + rand(60s)). |

---

## 🚀 The SDE-3 Edge: Near-Cache
If the interviewer asks: *"Redis is fast, but 1ms network latency is still too slow for my 1M RPS system. What now?"*

**The SDE-3 Answer:** Use a **Multi-Level Cache**.
1. **L1 (Local/Near Cache):** Store the most popular keys in the application's local memory (using Guava/Caffeine). Latency: **< 1μs**.
2. **L2 (Distributed Cache):** If missed, check Redis. Latency: **1-2ms**.
3. **L3 (Database):** If missed, check the DB. Latency: **50ms+**.
*Warning:* You must handle **Cache Invalidation** between nodes when L2 changes (use Redis Pub/Sub to invalidate L1s).
