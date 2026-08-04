# 🏢 SD007 - URL Shortener

## 📋 Tracker Metadata
| Column | Value / Status |
| :--- | :--- |
| **Problem ID** | SD007 |
| **Category** | Infrastructure |
| **Difficulty** | 🟡 Medium |
| **Interview Frequency** | 🔥 Must Know |
| **Target Companies** | Google, Amazon, Meta, Uber |
| **SDE-2 Mandatory** | ✅ Yes |
| **Status** | Completed |
| **Times Practiced** | 1 |
| **Last Practiced** | 2026-07-18 |
| **Next Review** | 2026-07-25 |
| **Confidence** | 🟢 Applied |
| **Mastery** | 🟢 Expert |

---

## 📋 1. Core Requirements & Scale

### Functional Requirements
*   **Shorten URL:** User submits a long URL and receives a unique, shortened URL (e.g., `https://tiny.url/abcdefg`).
*   **Redirect URL:** User accesses a shortened URL and is redirected to the original destination URL (using HTTP 302 temporary redirection to preserve analytics).
*   **Custom Aliases:** Users can request custom short links (e.g., `https://tiny.url/my-custom-alias`).
*   **Analytics Tracking:** Track redirection metrics (click counts, referrers, and geo-location) without slowing down the redirect path.
*   **Expiration Support:** Links can optionally have a client-defined Expiration TTL.

### Non-Functional Requirements
*   **High Availability:** 99.99% uptime target (redirect path must stay active even if write databases are degraded).
*   **Ultra-Low Latency:** P99 read redirection latency $< 100\text{ ms}$ (ideal target is $< 50\text{ ms}$ at edge CDNs).
*   **Uniqueness & Safety:** Auto-generated keys must never collide. Custom aliases must be validated atomically to prevent race condition duplicates.
*   **Scale Resiliency:** The write path must easily absorb massive marketing campaigns generating traffic spikes.

### Scale Targets (Back-of-the-Envelope)
We base our calculations on the [Capacity Estimation Guide](../02-Scale-From-Zero/02-Capacity-Estimation.md) rules of thumb:
*   **Daily Active Users (DAU):** 100 Million
*   **Read-to-Write Ratio:** 10:1 (Read-heavy workload)
*   **Throughput Calculations:**
    *   **Writes/day:** 10 Million new short URLs generated.
    *   **Reads/day:** 100 Million links redirected.
    *   **Average Write QPS:** $\frac{10,000,000}{100,000} = 100 \text{ writes/sec}$ (Peak: $300 \text{ QPS}$)
    *   **Average Read QPS:** $\frac{100,000,000}{100,000} = 1,000 \text{ reads/sec}$ (Peak: $3,000 \text{ QPS}$)
*   **Storage Calculations (5-Year Window):**
    *   Assume average record payload = 500 bytes (Short Key, Long URL, metadata, Created At, Expires At).
    *   **Daily Storage:** $10\text{M writes} \times 500 \text{ bytes} = 5\text{ GB/day}$.
    *   **5-Year Storage:** $5\text{ GB/day} \times 365 \text{ days} \times 5 \text{ years} \approx 9.1 \text{ TB}$.
*   **Bandwidth Calculations:**
    *   **Ingress (Writes):** $100 \text{ QPS} \times 500 \text{ bytes} = 50\text{ KB/s} \approx 400\text{ Kbps}$
    *   **Egress (Reads):** $1,000 \text{ QPS} \times 500 \text{ bytes} = 500\text{ KB/s} \approx 4\text{ Mbps}$
*   **Cache Allocation (80/20 Rule):**
    *   We cache the hot 20% of daily read traffic.
    *   **RAM Needed:** $20\% \text{ of } 100\text{M reads/day} \times 500\text{ bytes} = 10 \text{ GB of RAM}$.

---

## 📐 2. High-Level Architecture

The system keeps the compute layer (API Web Servers) entirely stateless. Uniqueness is managed via a range-allocation scheme.

```
                                     [ Client Request ]
                                             │
                                             ▼
                                     [ Load Balancer ]
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      ▼ (Write: POST)                               ▼ (Read: GET)
               [ Write API ]                                 [ Read API ]
                │         │                                   │        │
     Check range│         │ Write mapping                     │        │ Cache Hit
     allocations│         ▼                                   ▼        ▼
                │   [ Cassandra DB ]                    [ Redis Cache Cluster ]
                ▼   (Partitioned on                         (Cache-Aside)
           [ ZooKeeper ]  short_key)
           (Range Coord.)
```

---

## ⚖️ 3. Deep Dive & Core Components

### 1. The Key Generation Algorithm: Why Range-Allocation Wins
We have three primary architectural choices to generate the 7-character short keys:

1.  **Hashing Approach (MD5 + Base62):** MD5 hashes the long URL, and we take the first 43 bits (7 characters in Base62).
    *   *Problem:* Hash collisions. If `MD5(long_url)` collides with an existing short key, we must check the DB, append a salt, and re-hash. This introduces a read-before-write penalty.
2.  **Key Generation Service (KGS):** A standalone worker pool pre-generates keys and stores them in a "free key table." The Write API server simply picks an unused key.
    *   *Problem:* Introduces a single point of failure (KGS database lock contention and latency overhead to fetch unused keys).
3.  **Range-Based Counter Allocator (Recommended SDE-3 Solution):**
    *   We use a distributed coordinator like **ZooKeeper** to manage a central global counter.
    *   ZooKeeper distributes numeric ID ranges to each Write API server (e.g., Server 1 gets `1` to `1,000,000`, Server 2 gets `1,000,001` to `2,000,000`).
    *   Each Write Server keeps its allocated counter in memory and increments it atomically for every write request.
    *   The base-10 ID is encoded to Base62 (characters `[a-zA-Z0-9]`). A 7-character Base62 string allows $62^7 \approx 3.5 \text{ Trillion}$ unique IDs, easily covering our 5-year projections.
    *   Once a server runs out of its assigned range, it requests a new block of 1 million IDs from ZooKeeper.

```
                      [ ZooKeeper Range Coordinator ]
                         │                      │
                 Allocates Range         Allocates Range
                     1 - 1M                 1M - 2M
                         ▼                      ▼
                  [ Write Server 1 ]     [ Write Server 2 ]
                  Local Counter: 104     Local Counter: 1,000,503
                  Base62: '00000Be'      Base62: '00005zF'
```

---

### 2. Deduplication: Why We Explicitly Avoid It
A common trap is trying to deduplicate the same long URL into a single short URL. In production, **we do not deduplicate** due to clear system design trade-offs:

*   **Broken Analytics:** If two different users shorten `google.com`, they must get distinct short URLs. If they shared a single key, their analytics (clicks, geo-location, referrer metrics) would merge, violating data isolation.
*   **Write Speed Penalities:** Checking if a long URL has already been shortened requires querying the database on every insert. This requires a secondary index on `long_url` in our database, which drastically degrades write throughput and increases write amplification.
*   **Storage Trade-off:** Storage is cheap ($9.1\text{ TB}$ for 5 years costs very little). We trade storage cost for massive write performance gains.

---

### 3. Database Selection: NoSQL over SQL
We select **Cassandra** (or **DynamoDB**) as the primary database storage engine:
*   **No Relationships:** The dataset is a flat key-value model (`short_key` $\rightarrow$ `long_url`, `user_id`, `created_at`, `expires_at`). We do not need SQL `JOIN`s.
*   **Write Performance:** Cassandra uses an **LSM-Tree** storage engine, allowing sequential append-only writes to MemTable/SSTables, perfectly absorbing our peak write QPS.
*   **Horizontal Scaling:** Cassandra shards data natively using consistent hashing on the partition key (`short_key`), allowing us to scale the database cluster by simply adding nodes.

---

### 4. Read Redirection: HTTP 302 vs 301
*   **HTTP 301 (Moved Permanently):** Browsers cache this redirection. Subsequent requests bypass our shortener servers and go directly to the destination URL. This offloads read traffic, but **completely breaks analytics tracking**.
*   **HTTP 302 (Found - Temporary Redirect) [Recommended]:** Browsers will hit our Read API on every single click, allowing us to capture click counts, geo-location, and device types for analytics.
*   **Optimization:** To prevent the 302 redirect from overloading the database, we deploy a **Redis Cache-Aside Cluster** to handle 80%+ of the read redirections from memory.

---

### 5. Managing Custom Aliases
Custom aliases (e.g., `tiny.url/my-cool-key`) bypass the range allocator and can cause conflicts:
*   **Partitioning Solution:** Auto-generated keys are strictly 7 characters. We restrict custom aliases to be either shorter or longer than 7 characters (e.g., $\ge 8$ chars). This physically isolates the namespace, guaranteeing zero collisions.
*   **Atomic Write Validation:** To prevent duplicate custom aliases under write concurrency, we execute the write as a Cassandra **Lightweight Transaction (LWT)** (`INSERT ... IF NOT EXISTS`) or use a unique constraint index in SQL.

---

### 6. Link Expiration & Pruning
We prevent database bloat from expired links using a hybrid approach:
*   **Row-Level TTL:** In Cassandra, we set a native TTL on the row if the user specifies an expiration date. Once reached, Cassandra marks it as a tombstone for deletion during compaction.
*   **Lazy Deletion:** If a user accesses an expired link before database compaction removes it, the Read API detects the expiration timestamp, deletes the row immediately, and returns HTTP 404.

---

## 🚫 4. Common Mistakes & Interview Playbook

### Common Mistakes (The "Junior" Signals)
*   **The Hashing Trap:** Suggesting MD5/SHA256 hashing without identifying the collision write check penalty.
*   **The HTTP 301 Blunder:** Proposing HTTP 301 redirect and claiming we will still track click metrics (browsers cache 301s, bypassing your servers).
*   **Full-Table Scans for Expiration:** Designing an hourly cron job that does a full-table database scan to delete expired URLs.

### Interview Tip (The "Strong Hire" Signal)
> *"For our URL Shortener, we reject duplicate URL deduplication. While it saves minimal storage, it breaks analytics isolation for users and introduces secondary indexes that create write bottlenecks. Instead, we scale writes horizontally using a stateless API tier coordinated by a ZooKeeper Range Counter Allocator, and cache reads at the edge with CDN nodes returning HTTP 302 redirects to preserve analytics tracking."*

---

## 💡 5. My Practice Notes & Whiteboard
*Use this section to sketch your designs, document review feedback, or note specific learnings.*

*   **Key Learnings:** Range allocation is highly superior to hashing because it guarantees collision-free key generation on the first write.
*   **Mistakes Made during Mocks:** Initially suggested HTTP 301 redirection without realizing it breaks analytics tracking. Replaced with HTTP 302 backed by a Redis cluster.
*   **Next Review Focus:** Deep dive into how ZooKeeper handles range allocation node failures without leaving gaps in the counter sequence.