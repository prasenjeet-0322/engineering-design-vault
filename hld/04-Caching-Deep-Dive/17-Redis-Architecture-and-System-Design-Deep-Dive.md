# ⚡ Redis Architecture & System Design Deep Dive

| Field | Value |
|---|---|
| **Concept ID** | C031 |
| **Category** | Caching & In-Memory Stores |
| **Difficulty** | 🔥 Hard |
| **Target Roles** | Mid-Level, Senior (SDE-2/3), Staff System Architects |
| **Interview Frequency** | 🌟 Top Tier (Google, Meta, Uber, Netflix, Stripe, Amazon) |

---

## 🧭 Executive Overview

Redis (Remote Dictionary Server) is the industry standard for in-memory, sub-millisecond data storage. While junior engineers treat Redis merely as a "string cache", senior engineers leverage its **rich data structures, atomic primitives, cluster sharding, and event mechanisms** to build high-throughput distributed systems.

This guide provides an exhaustive, production-grade system design reference based on the **HelloInterview Framework** and real-world high-concurrency architectures.

---

## 1. ⚙️ Redis Core Architecture & Runtime Mechanics

```
                             REDIS SINGLE-THREADED ENGINE
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                                                                             │
 │  Incoming Connections ──► [ I/O Multiplexing Loop (epoll / kqueue) ]        │
 │                                            │                                │
 │                                            ▼                                │
 │                                  [ Event Dispatcher ]                       │
 │                                            │                                │
 │                                            ▼                                │
 │                                 [ Execution Command Engine ]                │
 │                             (Single-Threaded In-Memory Core)                │
 │                                            │                                │
 │                                            ▼                                │
 │                              [ Dict / SkipList / Memory ]                   │
 │                                                                             │
 └─────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Why Single-Threaded Core?
1. **Zero Context Switching:** Eliminates CPU kernel context-switching overhead and CPU cache thrashing.
2. **Zero Lock Contention:** Eliminates race conditions, mutex deadlocks, and synchronization overhead on memory pointers.
3. **CPU is Rarely the Bottleneck:** In-memory lookups run in sub-microseconds; network I/O and memory bandwidth are the real physical bottlenecks.
4. **I/O Multiplexing:** Uses non-blocking OS primitives (`epoll` on Linux, `kqueue` on BSD/macOS) allowing a single thread to juggle tens of thousands of concurrent client sockets.

> **Note on Modern Redis (v6.0+):** Network I/O socket reading and writing is multi-threaded, but the **core command execution engine remains strictly single-threaded and atomic**.

---

### 1.2 Infrastructure Topologies

```
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│ Master-Replica          │ Redis Sentinel (HA)     │ Redis Cluster (Scale)   │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ [Master]                │ [Sentinel Quorum]       │ [Shard 1 (Slots 0-5460)]│
│   │ (Async Rep)         │   │ (Monitors & Auto-FO)│ [Shard 2 (5461-10922)]  │
│   ▼                     │   ▼                     │ [Shard 3 (10923-16383)] │
│ [Replica 1] [Replica 2] │ [Master] ──► [Replica]  │ 16,384 Hash Slots       │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

* **Master-Replica:** Master serves writes and reads; Replicas replicate asynchronously. Caveat: failover is manual.
* **Redis Sentinel:** Provides High Availability (HA) for non-clustered setups. Sentinel nodes run a Raft/Gossip-like quorum to detect master failure and automatically elect a replica as the new master.
* **Redis Cluster:** Horizontal partitioning across nodes using **16,384 Hash Slots**:
  $$\text{Slot} = \text{CRC16}(\text{key}) \pmod{16384}$$
  - Using **Hash Tags** (`{user_123}:profile` and `{user_123}:orders`) guarantees related keys map to the **same hash slot**, enabling multi-key transactions within a cluster.

---

### 1.3 Persistence Modes: RDB vs. AOF

| Persistence Mode | Mechanism | Pros | Cons / Data Loss Window |
|---|---|---|---|
| **RDB (Snapshotting)** | Point-in-time binary snapshot of memory dumped to disk via `bgsave` (fork child process). | Compact `.rdb` file, instant server restart recovery. | Loses all data between snapshots (e.g. up to 5–15 minutes of writes). |
| **AOF (Append-Only File)** | Logs every write command sequentially to an append-only file on disk. | High durability. Configurable `appendfsync everysec` (max 1s loss) or `always` (0s loss). | Larger disk footprint, slower restart replay. |
| **Hybrid (RDB + AOF)** | Default in modern Redis: RDB snapshot base with incremental AOF tail. | Fast restart times + maximum durability. | Slightly higher background CPU overhead during compaction. |

---

## 2. 🗄️ The 8 Essential Redis Data Structures in System Design

```
┌──────────────────────┬──────────────────────────────────┬───────────────────────────────┐
│ Data Structure       │ Underlying C Implementation      │ Prime System Design Use Case  │
├──────────────────────┼──────────────────────────────────┼───────────────────────────────┤
│ **1. String**        │ SDS (Simple Dynamic String)      │ KV Cache, Bitmaps, HLL        │
│ **2. Hash**          │ ZipList / HashTable              │ User Profiles, DTO Entities   │
│ **3. List**          │ QuickList (Doubly Linked + Zipl) │ Activity Feeds, Simple Queues │
│ **4. Set**           │ IntSet / HashTable               │ Deduplication, Social Graph   │
│ **5. Sorted Set**    │ SkipList + Hash Table            │ Leaderboards, Rate Limiters   │
│ **6. HyperLogLog**   │ Probabilistic Cardinality Array  │ Unique Visitors ($O(1)$ RAM)  │
│ **7. Geospatial**    │ 52-bit Geohash encoded in ZSet   │ Uber Driver Proximity, Yelp   │
│ **8. Streams**       │ Radix Tree (Rax) + Listpack      │ Event Log, Message Broker     │
└──────────────────────┴──────────────────────────────────┴───────────────────────────────┘
```

---

## 3. 🛠️ Deep Dive: Core System Design Capabilities & Patterns

### 3.1 Distributed Locks (Redlock & Fencing Tokens)

```
                              DISTRIBUTED LOCKING PATTERN
                              
  App Client 1 ──► [ SET resource_lock "uuid_1" NX PX 30000 ] ──► (Lock Acquired! ✅)
                          │
                   (GC Pause / Network Lag > 30s)
                          │
  App Client 2 ──► [ SET resource_lock "uuid_2" NX PX 30000 ] ──► (Lock Acquired! ✅)
                          │
                   💥 RACE CONDITION BUG:
                   Client 1 wakes up and writes to DB while Client 2 is also writing!
```

#### 🛡️ The Senior Solution: Safe Release + Fencing Tokens
1. **Acquire:** `SET lock:order_123 <random_token> NX PX 30000` (Atomic Set if Not Exists with 30s TTL).
2. **Safe Release via Lua Script:** Never delete a lock blindly with `DEL`. Check that the token matches to avoid releasing another client's acquired lock:
   ```lua
   if redis.call("get", KEYS[1]) == ARGV[1] then
       return redis.call("del", KEYS[1])
   else
       return 0
   end
   ```
3. **Fencing Tokens (Martin Kleppmann Standard):** To prevent zombie writes during long GC pauses, each lock acquisition returns a monotonically increasing sequence ID (`fencing_token`). The database rejects any write that carries a lower token than the latest processed transaction.

---

### 3.2 Real-Time Leaderboards (Sorted Sets / ZSets)

Sorted Sets use a **SkipList + Hash Table** internally, delivering $O(\log N)$ inserts, updates, and rank lookups.

```text
// 1. Update user score (O(log N))
ZADD leaderboard:weekly 4500 "user_alice"
ZADD leaderboard:weekly 5200 "user_bob"

// 2. Fetch Top 10 users with scores (O(log N + M))
ZREVRANGE leaderboard:weekly 0 9 WITHSCORES

// 3. Fetch exact rank of a user (O(log N))
ZREVRANK leaderboard:weekly "user_alice"  // Output: 1 (0-indexed)
```

---

### 3.3 Rate Limiting: Sliding Window Logs & Token Bucket

```
                           SLIDING WINDOW LOG RATE LIMITER
                           
   Timeline (Past 60 Seconds):
   ├───────────[ X ]───────[ X ]──────────────[ X ]─────────────┤ (Now)
               10s ago     35s ago            5s ago
   
   1. ZREMRANGEBYSCORE rate_limit:user_123 0 (now - 60s)  <-- Evict expired timestamps
   2. ZCARD rate_limit:user_123                           <-- Count remaining calls
   3. If count < Limit ──► ZADD rate_limit:user_123 now now + Allow Request
   4. If count >= Limit ──► Reject (HTTP 429 Too Many Requests)
```

#### Atomic Sliding Window Lua Script:
```lua
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])

-- Remove timestamps older than window
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)

-- Count current requests in window
local current_requests = redis.call('ZCARD', key)

if current_requests < limit then
    redis.call('ZADD', key, now, now)
    redis.call('EXPIRE', key, math.ceil(window / 1000))
    return 1 -- Allowed
else
    return 0 -- Rejected (Rate limited)
end
```

---

### 3.4 Proximity Search (Geospatial Indexing)

Redis encodes latitude and longitude into **52-bit integer Geohashes** stored inside standard Sorted Sets:

```text
// 1. Add Driver Locations (O(log N))
GEOADD drivers:nyc -73.9857 40.7488 "driver_mike"
GEOADD drivers:nyc -73.9851 40.7489 "driver_sara"

// 2. Search drivers within 5km radius (O(N + log M))
GEOSEARCH drivers:nyc FROMLONLAT -73.9855 40.7488 BYRADIUS 5 km WITHDIST WITHCOORD
```
* **Time Complexity:** $O(N + \log M)$, where $N$ is candidate elements in grid bounding box and $M$ is matched items within the exact radius circle.

---

### 3.5 Redis Streams: Event Sourcing & Work Distribution

Redis Streams (`XADD`, `XREADGROUP`, `XCLAIM`) provide a persistent append-only log with Consumer Group coordination.

```
                               REDIS STREAMS WORK QUEUE
                               
  Producer ──► [ XADD stream:tasks * task_id 101 payload "{...}" ]
                                    │
                                    ▼
                      Stream: "stream:tasks" (Append-Only Log)
                                    │
                         Consumer Group: "workers"
                                    │
              ┌─────────────────────┴─────────────────────┐
              ▼                                           ▼
      Worker 1 (XREADGROUP)                       Worker 2 (XREADGROUP)
      Processes msg 101                           Processes msg 102
              │                                           │
      [ XACK stream:tasks workers 101 ]           (Worker 2 crashes!)
      (Removed from PEL)                                  │
                                                  Worker 1 claims orphan via:
                                                  [ XAUTOCLAIM stream:tasks workers ... ]
```

* **Pending Entries List (PEL):** Tracks unacknowledged in-flight messages per worker.
* **Orphan Recovery:** When a worker crashes, `XAUTOCLAIM` allows healthy workers to claim pending tasks whose idle time exceeds safety thresholds.

---

### 3.6 Pub/Sub vs. Sharded Pub/Sub

```
1. Classic Cluster Pub/Sub (Legacy):
   Publish to Node 1 ──► Broadcasts to ALL Cluster Nodes ──► Wasted inter-node bandwidth!

2. Redis 7 Sharded Pub/Sub (Modern Production):
   Channel hashes to Slot: SPUBLISH / SSUBSCRIBE
   Message routes ONLY to the specific shard node owning the channel slot!
```

> **Why Not Build Homegrown Pub/Sub with DB/Redis Sets?**  
> Storing subscriber IP sets in Redis and querying them manually requires **3 network hops** + opening dynamic TCP connections per broadcast. Native Redis Pub/Sub multiplexes subscriptions over a single long-lived TCP connection in **2 network hops** with zero memory leaks when clients disconnect.

---

## 4. 🚨 Shortcomings, Bottlenecks & Remediations

### 4.1 Hot Key Problem & Solutions

When millions of users read the same key simultaneously (e.g., viral product or breaking news), a single Redis node's CPU/NIC becomes saturated.

```
HOT KEY MITIGATION STRATEGIES:

  Strategy 1: Client-Side L1 Cache
    App Server (Local In-Memory Cache, TTL 2-5s) ──► Absorbs 95%+ of reads before hitting Redis.

  Strategy 2: Key Replication / Salting
    Write: Fan out writes to [ product:101:1, product:101:2 ... product:101:10 ]
    Read:  Client picks random suffix (product:101:rand(1..10)) to balance across shards.

  Strategy 3: Read Replicas with READONLY
    Route read traffic across read-replicas; master handles writes only.
```

---

### 4.2 Big Keys & Memory Eviction

* **Big Keys Hazard:** Storing huge JSON strings (> 10MB) or sets with millions of members causes event loop latency spikes. Deleting big keys with `DEL` blocks the single thread for hundreds of milliseconds.
  - **Mitigation:** Use **`UNLINK`** instead of `DEL` (asynchronously reclaims memory in a background thread).
* **Eviction Policies (`maxmemory-policy`):**
  - `allkeys-lru`: Evicts least recently used keys across all data (Best default for generic caches).
  - `volatile-lru`: Evicts LRU keys among keys with an explicit TTL.
  - `allkeys-lfu`: Evicts least frequently used keys (Best when access popularity is skewed).
  - `noeviction`: Returns errors on writes when memory is full (Best when Redis is used as a strict datastore).

---

## 5. ⚖️ When to Use vs. When NOT to Use Redis

| Scenario | Recommendation | Rationale |
|---|---|---|
| **Sub-millisecond Session/KV Cache** | ✅ **Use Redis** | In-memory $O(1)$ operations with TTL expiration. |
| **Real-Time Leaderboard / Gaming** | ✅ **Use Redis ZSets** | Built-in SkipList ranks millions of users in $O(\log N)$. |
| **Distributed Rate Limiter** | ✅ **Use Redis + Lua** | Atomic execution eliminates race conditions. |
| **System of Record (Primary DB)** | ❌ **Do NOT Use** | Async replication & AOF sync windows mean acknowledged writes can be lost on sudden power failure. |
| **Datasets Exceeding RAM Budget** | ❌ **Do NOT Use** | RAM is expensive. Use SSD-backed NoSQL (Cassandra/DynamoDB/Aerospike). |
| **Complex Relational / SQL Joins** | ❌ **Do NOT Use** | No join engine or cross-key transaction semantics across cluster shards. |
| **High-Volume Multi-Consumer Streaming** | ❌ **Use Kafka Instead** | Kafka provides multi-week disk retention, zero-copy reads, and massive partition throughput. |

---

## 6. 🎯 SDE-2 / Senior Interview Verbal Script Matrix

```
┌────────────────────────┬─────────────────────────────────────────────────────────────┐
│ Interview Topic        │ "Strong Hire" Verbal Answer                                 │
├────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Single-Threaded Speed  │ "Redis achieves 100k+ ops/sec by eliminating context        │
│                        │  switching and lock overhead through a single-threaded      │
│                        │  core combined with non-blocking epoll I/O multiplexing."   │
├────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Distributed Locks      │ "I use SET NX PX with a random UUID, release safely via Lua │
│                        │  token validation, and pass monotonic fencing tokens to the │
│                        │  storage layer to block expired zombie writes."             │
├────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Hot Key Protection     │ "I implement a 2-tier caching topology: L1 Caffeine in-app   │
│                        │  cache for viral keys, combined with key-salting across      │
│                        │  shards with random read routing."                          │
├────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Persistence Strategy   │ "For caching, RDB snapshots are sufficient. For mission-    │
│                        │  critical state, I use Hybrid persistence with AOF fsync    │
│                        │  every second to balance durability with sub-ms throughput."│
└────────────────────────┴─────────────────────────────────────────────────────────────┘
```
