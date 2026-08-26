# ⚡ L019: Apache Kafka

## 📖 Overview
### What is this component?
**Apache Kafka** is a distributed, partitioned, replicated **append-only commit log** designed for high-throughput, fault-tolerant event streaming. Originally developed at LinkedIn and open-sourced via Apache, Kafka serves as the central data nervous system for event-driven architectures, real-time analytics, log aggregation, and Change Data Capture (CDC) pipelines.

### Core Capabilities
* **Extreme Throughput:** Processes **millions of events per second per broker** using sequential disk I/O and kernel-level zero-copy OS transfers (`sendfile`).
* **Message Replayability:** Retains log events for days, months, or indefinitely, allowing independent consumer groups to replay historical data at arbitrary offsets.
* **Partitioned Scalability:** Horizontally partitions topics across multiple brokers to enable parallel processing and linear throughput scaling.
* **Guaranteed Partition Ordering:** Guarantees strict FIFO ordering of events within a single partition via partition keys.

---

## 📋 Tracker Metadata
| Column | Value / Status |
| :--- | :--- |
| **Category** | Stream Processing / Event Log |
| **Type** | Log-Based Distributed Commit Log |
| **Primary Use Case** | Real-time event streaming, event sourcing, CDC, log aggregation |
| **Strengths** | 1M+ msg/sec, persistent log replay, consumer group scalability |
| **Weaknesses** | High operational complexity, no message-level priority queues, no per-message ACKs |
| **Best For** | High-throughput event backbone, multi-consumer data pipelines, CQRS/Saga event streams |
| **Never Use When** | Simple async task queues (use SQS/RabbitMQ), single-message priority routing |
| **Max Scale** | 7+ Trillion messages/day (LinkedIn scale), 100k+ partitions per cluster |
| **Consistency Model** | Tunable (Strong Consistency with `acks=all` + `min.insync.replicas=2`) |
| **CAP Choice** | **CP** (when configured with `unclean.leader.election.enable=false`) |
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

## ⚖️ Architectural Trade-offs & Deep Dive

```
                             KAFKA ARCHITECTURE OVERVIEW
                             
     PRODUCERS                    KAFKA BROKER CLUSTER                   CONSUMER GROUPS
┌──────────────────┐           ┌──────────────────────────┐           ┌──────────────────┐
│ Payment Service  │──────┐    │ TOPIC: order-events      │    ┌─────►│ Analytics Group  │
└──────────────────┘      │    │                          │    │      │ (Offset: 1042)   │
                          ├───►│  Partition 0 (Leader)    ├────┤      └──────────────────┘
┌──────────────────┐      │    │  [Seg 01][Seg 02][Seg 03]│    │      ┌──────────────────┐
│ Inventory Service│──────┘    │                          │    ├─────►│ Email Service    │
└──────────────────┘           │  Partition 1 (Leader)    ├────┘      │ (Offset: 980)    │
                               │  [Seg 01][Seg 02]        │           └──────────────────┘
                               └──────────────────────────┘
```

1. **Log-Based Persistence vs. In-Memory Queues:**
   Unlike traditional brokers (RabbitMQ/ActiveMQ) that delete messages upon ACK, Kafka treats data as an append-only log stored on physical disk segments. Messages persist regardless of consumption.
2. **Dumb Broker, Smart Consumer:**
   Kafka brokers maintain zero per-consumer state. Consumers track their own position via an **Offset** (`__consumer_offsets` topic). This reduces broker CPU overhead from $O(N)$ subscriber tracking to $O(1)$ disk sequential reads.
3. **Pull-Based Consumer Model:**
   Consumers poll batches of records from the broker (`poll(Duration)`). This naturally handles **Backpressure**—if a downstream worker slows down, it simply polls less frequently, eliminating memory buffer overflows on the broker.
4. **Partition Keying & Skew Risk:**
   Events with the same `partition_key` (e.g., `user_id`) hash to the exact same partition, guaranteeing strict ordering for that entity. However, skewed partition keys (e.g., a super-user ID) create hot partitions that bottleneck individual consumers.

---

### 🚫 When NOT to Use Kafka (Anti-Patterns)

1. **Simple Async Task Queues (e.g., Send Password Reset Email):**
   * *Why:* Kafka lacks native per-message ACK/NACK and individual message retries. Using Kafka for simple task processing requires building custom retry topics and dead-letter queues. Use **RabbitMQ** or **AWS SQS**.
2. **Individual Message Priority Queues:**
   * *Why:* Kafka partitions are append-only FIFO streams. You cannot process a "high-priority" event ahead of an existing log entry without routing it to a separate topic.
3. **Low-Throughput Applications (<1,000 msg/day):**
   * *Why:* Operating ZooKeeper/KRaft, monitoring ISRs, and managing schema registries adds massive DevOps burden for minimal traffic.

---

## ⚙️ Internal Architecture (The "Deep Dive")

### 1. Log Segment Storage Mechanics & Sparse Indexing
* **Log Segments:** Each partition is a directory containing continuous log segments (default: 1 GB `.log` files). Old segments are closed and deleted/compacted based on time (`log.retention.hours`) or size (`log.retention.bytes`).
* **Sparse Indexes:** Kafka creates a `.index` (offset to physical file position) and `.timeindex` (timestamp to offset) file for every segment. Instead of indexing every record, Kafka indexes every $N$ bytes (default: 4 KB), allowing sub-millisecond binary-search lookups on disk without consuming huge JVM Heap memory.

```
.log file:   [Record 0 @ Pos 0] [Record 1 @ Pos 120] ... [Record 34 @ Pos 4096] ...
.index file: [Offset 0 -> Pos 0]                          [Offset 34 -> Pos 4096]
```

### 2. Zero-Copy OS Memory Optimization
Traditional data transfer requires 4 context switches and 3 memory copies:
`Disk ➔ OS PageCache ➔ JVM Heap ➔ Socket Buffer ➔ NIC`

Kafka bypasses the JVM Heap using the Linux `sendfile()` syscall:
`Disk ➔ OS PageCache ➔ NIC Buffer` (Direct Kernel Transfer)
* **Impact:** Eliminates JVM Garbage Collection (GC) pauses on high-throughput reads and reduces CPU context switching by 70%.

### 3. Replication & Consensus (ISR, LEO, and High Watermark)
* **ISR (In-Sync Replicas):** The set of follower replicas actively keeping up with the partition Leader within `replica.lag.time.max.ms`.
* **LEO (Log End Offset):** The offset of the last written message in a partition.
* **HW (High Watermark):** The highest offset that has been replicated to **ALL** members of the ISR. Consumers can only read up to the High Watermark to prevent dirty reads of un-replicated data.
* **KRaft (Kafka Raft Metadata Mode):** Replaces ZooKeeper with an event-driven quorum controller running inside Kafka itself, accelerating partition creation from seconds to milliseconds and scaling clusters to 1,000,000+ partitions.

### 4. Consumer Group Rebalancing Mechanics
* **Group Coordinator:** A broker assigned to manage group membership.
* **Eager Rebalance (Legacy):** All consumers stop processing, drop partition assignments, and re-join the group. Causes global processing pauses ("stop-the-world").
* **Cooperative Sticky Reassignor (Modern):** Consumers continue processing unaffected partitions while only disputed partitions are revoked and reassigned in incremental rounds.

### 5. Log Compaction (`cleanup.policy=compact`)
* **Retention by Key:** Instead of deleting old log segments by age (`delete`), log compaction retains the **latest non-null value for every partition key** indefinitely.
* **Use Cases:** Rebuilding in-memory caches, materializing CDC database table snapshots, and KTable state restoring. Deleted keys are marked with a `tombstone` (null payload) which is eventually purged after `delete.retention.ms`.

### 6. Schema Evolution & Confluent Schema Registry (Avro / Protobuf)
* **Wire Format Protocol:** Producers compress events using Avro/Protobuf schemas. Instead of attaching the schema to every message, the producer registers the schema with the Schema Registry once and prefixes the payload bytes:
  ```
  [ Magic Byte (1 Byte: 0x00) ] [ Schema ID (4 Bytes) ] [ Avro Binary Payload... ]
  ```
* **Compatibility Guarantees:**
  * `BACKWARD`: New schema can read data written by old schema (Update consumers first).
  * `FORWARD`: Old schema can read data written by new schema (Update producers first).
  * `FULL`: Both backward and forward compatible.

### 7. Kafka Streams & Embedded RocksDB State Stores
* **Stateful Stream Processing:** Kafka Streams allows windowed aggregations (e.g., 5-minute rolling averages).
* **RocksDB Integration:** Stateful operations store intermediate state in a local embedded **RocksDB** key-value store on local disk. Every update to RocksDB is asynchronously written to an internal `-changelog` topic in Kafka, allowing a failed stream node to rebuild its RocksDB cache in seconds on another node.

### 8. Tiered Storage Architecture (KIP-405)
* **Decoupling Compute from Storage:** Active log segments (hot data) stay on high-speed local NVMe/EBS disks. Closed log segments (cold data > 24 hours old) are automatically offloaded to cloud object storage (AWS S3 / GCS).
* **Impact:** Cuts storage costs by 80% while retaining years of historical data for on-demand replay without bloating broker disk requirements.

---

## 📐 Standard Whiteboard Architecture Patterns

### 1. Transactional Outbox Pattern with Debezium CDC + Kafka
To prevent data inconsistency between a PostgreSQL DB write and a Kafka event publish, write the business entity and an `outbox` event into PostgreSQL in a single local ACID transaction. Debezium streams PostgreSQL's Write-Ahead Log (WAL) directly into Kafka.

```
[ Application ] ──1. ACID Txn──► [ Postgres DB (outbox table) ]
                                          │ (WAL Log)
                                          ▼ 2. CDC Stream
                                   [ Debezium Connector ] ──3. Publish──► [ Kafka Topic ]
```

### 2. Failure Modes & Disaster Mitigation
* **Rebalance Storm:** Triggered when a slow consumer takes longer than `max.poll.interval.ms` to process a batch. The coordinator thinks the consumer is dead and kicks off continuous rebalances.
  * *Mitigation:* Reduce `max.poll.records` or offload heavy processing to a background worker thread pool.
* **Poison Pill Message:** A malformed payload that crashes the consumer every time it is polled, causing an infinite restart loop.
  * *Mitigation:* Wrap consumer processing in a `try-catch` block that publishes the unparseable record to a `topic-dlq` (Dead Letter Queue) and commits the offset.

---

## 🛠️ Critical Configurations & Production Tuning

### 1. Producer Configurations (Durability vs. Throughput)
```properties
# Durability & Exactly-Once Semantics (EOS)
acks=all                              # Wait for all ISR replicas to acknowledge (acks=-1)
enable.idempotence=true              # Eliminates duplicate messages from producer retries
max.in.flight.requests.per.connection=5 # Maximum unacknowledged requests per connection
retries=2147483647                    # Retry indefinitely on transient network errors

# High-Throughput Batching
compression.type=zstd                # zstd / snappy compression reduces network payload by 60%
batch.size=65536                      # 64 KB batch size allocation
linger.ms=20                          # Wait up to 20ms to batch messages together before sending
```

### 2. Broker Configurations (Cluster Durability & Availability)
```properties
min.insync.replicas=2                 # Minimum ISR required to accept a write when acks=all
unclean.leader.election.enable=false # Never elect a non-ISR follower as leader (prevents data loss)
auto.create.topics.enable=false      # Prevent rogue applications from creating un-configured topics
```

### 3. Consumer Configurations (Preventing Rebalance Storms)
```properties
enable.auto.commit=false             # Explicitly commit offsets only after processing completes
max.poll.records=200                  # Limit batch size to prevent processing timeouts
max.poll.interval.ms=300000           # 5 minutes maximum allowed time between poll() calls
partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor
```

---

## 💰 Cost & Operational Overhead
* **DevOps Complexity:** High. Operating self-hosted Kafka requires configuring disk I/O, OS page cache limits, JVM tuning, and cluster upgrades.
* **Managed Alternatives:** **AWS MSK**, **Confluent Cloud**, or **Aiven Kafka**. Eliminates KRaft/ZooKeeper operational pain at a ~2.5x infrastructure cost markup.

## 🥊 Direct Competitors & Alternatives
* **Kafka vs. RabbitMQ:** Kafka = High-throughput persistent log (replayable). RabbitMQ = Low-latency push-based task queue (deleted on ACK).
* **Kafka vs. AWS Kinesis:** Kinesis is AWS's managed alternative. Kinesis has strict 2 MB/sec per shard limits; Kafka handles arbitrary partition throughput.
* **Kafka vs. Redis Streams:** Redis Streams = Lightweight in-memory stream buffer. Kafka = Terabyte-scale persistent disk storage.

---

## 🔒 Security & Compliance
* **TLS Encryption:** In-transit encryption between clients and brokers (`SSL` / `SASL_SSL`).
* **Authentication & Authorization:** SASL/SCRAM, OAuth2, and Kafka ACLs (`kafka-acls.sh`) enforcing granular topic-level Read/Write permissions.
* **At-Rest Encryption:** Disk-level encryption via AWS EBS KMS or LUKS.

---

## 💼 Production Experience & Gotchas

### 1. Real-World Use Case
* **Platform:** *Kridaz Sports Platform & EA Overseas Monorepo*.
* **Implementation:** Deployed Kafka as the core event backbone for streaming venue booking updates, financial ledger transactions, and audit trails across microservices.

### 2. Lessons Learned (Gotchas)
* **Gotcha 1: The Partition Key Skew Trap:** A partition key hashed on `organization_id` sent 80% of all platform traffic to Partition 3 because one enterprise tenant accounted for most orders. The consumer processing Partition 3 lagged by 50,000 records while other consumer threads sat idle.
  * *Fix:* Compound partition keying (`tenant_id + "_" + hash(order_id)`) to evenly distribute load across partitions.
* **Gotcha 2: Auto-Commit Data Loss:** Default `enable.auto.commit=true` commits offsets on a background timer *before* the consumer finishes saving data to PostgreSQL. If the process crashes mid-work, messages are lost forever.
  * *Fix:* Disabled auto-commit and switched to explicit manual synchronous/asynchronous offset commits after successful DB transactions.
