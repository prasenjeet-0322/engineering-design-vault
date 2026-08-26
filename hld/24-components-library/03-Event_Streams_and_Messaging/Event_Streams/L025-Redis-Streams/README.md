# ⚡ L025: Redis Streams

## 📖 Overview
### What is this component?
**Redis Streams** is an in-memory, log-structured data type introduced in Redis 5.0. It models an append-only log data structure with native **Consumer Groups**, message IDs, and acknowledgment capabilities, delivering sub-millisecond in-memory stream processing with minimal operational overhead.

### Core Capabilities
* **Sub-Millisecond In-Memory Throughput:** Processes **100,000+ stream writes/sec** with microsecond latency directly from Redis RAM.
* **Native Consumer Groups (`XREADGROUP`):** Supports competing consumer groups, tracking message assignments, pending lists (PEL), and explicit `XACK` confirmations.
* **Low Operational Overhead:** Leverages existing Redis infrastructure without needing separate Kafka/RabbitMQ clusters.
* **Capped Stream Length (`MAXLEN`):** Automatically trims old stream records via `XADD key MAXLEN ~ 10000` to prevent memory exhaustion.

---

## 🎯 ⚡ TRIGGER POINTS: When to Use Redis Streams

| Trigger Scenario / Architectural Problem | Why Redis Streams is the EXACT Solution | Alternatives & Why They Fail |
| :--- | :--- | :--- |
| **1. Real-Time WebSocket Score Push (Kridaz Style)** <br>*(Pushing live sports scores to 50,000 connected WebSockets).* | In-memory `XADD` writes + `XREADGROUP` delivers sub-millisecond score updates to WebSocket servers with minimal memory footprint. | **Apache Kafka:** Adds heavy disk/JVM context switching overhead for ephemeral score feeds. |
| **2. Microsecond Latency Event Buffer** <br>*(Buffering high-frequency clickstream or IoT metrics).* | RAM-speed writes (`XADD`) absorb high-velocity spikes with near-zero latency. | **RabbitMQ:** Paging to disk under heavy ingress spikes degrades latency from 1ms to 50ms. |
| **3. Zero-DevOps Streaming for Small Teams** <br>*(Already running Redis for caching and need basic event streaming).* | Zero extra infrastructure required—simply invoke `XADD stream_name * field value`. | **Deploying Kafka / Pulsar:** Requires ZooKeeper/KRaft, broker clusters, and dedicated DevOps maintenance. |

---

## 📋 Tracker Metadata
| Column | Value / Status |
| :--- | :--- |
| **Category** | Event Streams & Messaging / In-Memory Stream |
| **Type** | In-Memory Append-Only Log Data Type |
| **Primary Use Case** | Real-time WebSocket event streaming, live sports feeds, lightweight event bus |
| **Strengths** | Sub-millisecond latency, zero-extra ops (uses existing Redis), Consumer Groups (`XREADGROUP`) |
| **Weaknesses** | Bound by Redis RAM capacity, non-persistent long term unless backed up, single-threaded CPU bottleneck |
| **Best For** | Kridaz-style real-time sports scores, WebSockets, in-memory event buffering |
| **Never Use When** | Multi-terabyte persistent log retention, complex AMQP routing |
| **Max Scale** | 100,000+ msgs/sec per Redis node |
| **Consistency Model** | Eventual Consistency (Async Redis replication to replicas) |
| **CAP Choice** | **AP** (Prioritizes low-latency in-memory throughput) |
| **Understanding** | 🟢 Applied |
| **Internals Known** | [x] Yes / [ ] No |
| **Interview Ready** | [x] Yes / [ ] No |
| **Used In Projects** | [x] Yes / [ ] No |
| **Key Config Known** | [x] Yes / [ ] No |
| **Comparison Known** | [x] Yes / [ ] No |
| **Last Revised** | 2026-08-05 |
| **Next Review** | 2026-11-05 |
| **Mastery** | 🟢 Expert |

---

## ⚙️ Internal Architecture (The "Deep Dive")

### 1. Radix Tree Storage & Message IDs
Redis Streams stores entries inside a compact **Radix Tree** (Rax). Message IDs follow the format `<millisecondsTime>-<sequenceNumber>` (e.g. `1722873600000-0`), guaranteeing strictly increasing time-series ordering.

### 2. Pending Entries List (PEL) & `XACK`
When a consumer reads a batch via `XREADGROUP`, Redis moves those IDs into the consumer group's **Pending Entries List (PEL)**. Once the consumer calls `XACK`, Redis removes the ID from the PEL, releasing memory.

---

## 🛠️ Critical Commands & Production Tuning

```bash
# 1. Add entry with capped stream size (~10,000 records)
XADD live_scores MAXLEN ~ 10000 * match_id 9981 score "2 - 1"

# 2. Create Consumer Group reading from latest ($) or start (0)
XGROUP CREATE live_scores score_group $ MKSTREAM

# 3. Consumer pulls 10 unread messages
XREADGROUP GROUP score_group worker_1 COUNT 10 BLOCK 2000 STREAMS live_scores >

# 4. Acknowledge processed message
XACK live_scores score_group 1722873600000-0
```

---

## 💼 Production Experience & Lessons Learned

### 1. Real-World Use Case
* **Platform:** *Kridaz Venue & Live Sports Platform*.
* **Implementation:** Utilized Redis Streams `XADD` to buffer live score changes from referee tablets and fan out updates to WebSocket servers pushing to 50,000 active mobile app clients.
