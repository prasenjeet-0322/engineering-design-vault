# ⚡ 01 - Cache Fundamentals

## 📋 Tracker Metadata
| Column | Value / Status |
| :--- | :--- |
| **Concept ID** | C015 |
| **Category** | Caching Foundations |
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
*   **Two-Sentence Trigger:** Caching is the process of storing copies of active data in a high-speed, volatile RAM-based storage layer (e.g., Redis, local memory) to bypass slow primary disk-based databases. It turns expensive $O(N)$ or network-constrained queries into $O(1)$ sub-millisecond memory lookups.
*   **Scalability Dimension:** Primary: **Read Latency** & **Throughput (QPS)**. Secondary: **Database Load Reduction**.

---

## ⚖️ 2. Trade-offs & Deep Dive

### The 4 Caching Topologies & Production Scenarios
| Topology | Best For | Production Scenario | Example Tech |
| :--- | :--- | :--- | :--- |
| **Client / Browser** | Reducing network round trips entirely | Caching static UI assets (CSS, JS), session tokens, or caching API GET responses locally. | HTML5 LocalStorage, Service Workers, HTTP headers (`Cache-Control`) |
| **Edge Cache (CDN)** | Low-latency static content delivery | Serving profile pictures, product catalog images, and video chunks close to the user's location. | Cloudflare, Akamai, AWS CloudFront |
| **Distributed Cache** | Shared, scalable backend state | Caching active user sessions, timeline feeds, or product inventory counts across stateless web servers. | Redis, Memcached |
| **Application Local** | Ultra-low latency database configs | Caching static database lookup dictionaries (e.g., country codes or zip rules) inside JVM/process memory. | Guava Cache, Caffeine, Ehcache |

---

### Core Cache Access Patterns
| Pattern | Data Flow Path | Pros | Cons | Ideal Workloads |
| :--- | :--- | :--- | :--- | :--- |
| **Cache-Aside (Lazy)** | Read misses load from DB and write to cache. App updates DB directly. | Cache only contains queried data. DB outages are non-blocking. | Triple network round-trip on cache miss. Stale reads if DB is updated directly. | Standard read-heavy web apps (user profiles). |
| **Write-Through** | Write to cache first; cache writes synchronously to DB. | Cache is always consistent with the DB. Low stale read risk. | High write latency penalty (blocking synchronous double writes). | Critical configuration profiles or system states. |
| **Write-Behind (Back)** | Write to cache first; cache writes asynchronously to DB. | Extremely fast write latency (RAM speeds). Batch merges writes. | Data loss risk if cache crashes before syncing to DB. Eventual consistency. | High-frequency IoT streams, click aggregators. |

*   **Ideal Use Cases:**
    *   High-read, low-write data patterns (e.g., static configuration, product descriptions).
    *   Repeatedly requested computations (e.g., user search results).
*   **Anti-Patterns / When NOT to use:**
    *   Strict transactional data where any stale read causes financial double-spends.
    *   Highly write-heavy access patterns with unique keys (leads to very low Hit Ratios and wasted memory).

---

### 🛠️ Polyglot Caching (The Real-World Answer)
Production systems deploy multiple caching tiers simultaneously to minimize backend load:
1.  **Browser Cache:** Prevents fetching static scripts from the internet.
2.  **CDN:** Caches images/videos close to global users.
3.  **API Gateway Cache:** Caches responses for heavy static endpoints.
4.  **Redis Cluster:** Stores active session states and pre-computed feed lists.
5.  **Local Application Cache (Caffeine):** Caches internal DB connections and configuration parameters.

---

## 💥 3. Resiliency & Operations

*   **Observability (The "Signal"):**
    *   `Cache Hit Ratio`: Hits / (Hits + Misses). Aim for > 85%.
    *   `Eviction Rate`: Rapidly increasing eviction rate indicates the cache size is too small.
    *   `Cache Memory Usage`: Checking for OOM (Out Of Memory) states.
*   **Operational Pitfalls & Mitigations:**
    *   *Cache Stampede (Thundering Herd):* Occurs when a hot key expires and concurrent requests overload the database. (Mitigate with Single-Flight locks or probabilistic pre-expiration).
    *   *Cache Avalanche:* Occurs when multiple keys expire at the same time or a Redis node fails, hitting the DB. (Mitigate with Jittered TTLs and distributed node clusters).
    *   *Cache Penetration:* Occurs when queries look for non-existent keys (e.g., ID -1), bypassing cache to hit the DB. (Mitigate with Bloom Filters or caching empty/null results).
    *   *Hot Key Throttling:* Extreme traffic on a single cache key hits network interface limits. (Mitigate by duplicating keys across nodes or utilizing local L1 near-caches).
*   **Blast Radius (The "Impact"):**
    *   If the cache hit ratio drops unexpectedly, the database CPU spikes, leading to thread exhaustion, cascading timeouts, and global API HTTP 504 errors.
*   **Numbers to Know:**
    *   RAM access latency: **~100 ns**
    *   Distributed cache over network (Redis): **~1 ms**
    *   Relational DB read: **~50 ms - 200 ms**

---

## 🚫 4. Interview Playbook

*   **Common Mistakes:**
    *   Assuming caching is a substitute for proper database indexing.
    *   Not accounting for memory usage footprint and capacity planning when designing the cache cluster size.
*   **Interview Tip (The "Strong Hire" Signal):**
    *   State: *"We recognize that caching is a dual-edged sword. It decreases read latency but introduces cache invalidation complexity. In our design, we avoid Cache Stampede by applying a single-flight mutex lock on cache misses, jitter our TTLs to prevent Cache Avalanche, and deploy Redis in a master-replica configuration across Availability Zones to protect against single points of failure."*

---

## 💡 5. My Custom Study Notes & Whiteboard
*Use this section to document your sketches, code blocks, or personal notes.*

