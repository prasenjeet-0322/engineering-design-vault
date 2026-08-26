# ⚡ L023: Google Cloud Pub/Sub

## 📖 Overview
### What is this component?
**Google Cloud Pub/Sub** is a fully managed, serverless, globally distributed asynchronous messaging service designed to provide low-latency, highly available event ingestion and stream delivery across cloud microservices, data analytics pipelines (Dataflow/BigQuery), and serverless workloads.

### Core Capabilities
* **Global Serverless Auto-Scaling:** Seamlessly scales from 1 message/day to tens of millions of messages per second with zero infrastructure provisioning, partition planning, or server management.
* **Dual Delivery Modes (Push & Pull):** Supports both client-initiated polling (**Pull**) and HTTPS webhook delivery (**Push**) directly to Cloud Run, Cloud Functions, or custom HTTP endpoints.
* **At-Least-Once Delivery & Dead Letter Topics:** Guarantees that every published message is delivered at least once to every subscription, with native Dead Letter Topic (DLT) retry redirection.
* **Unified Fan-out and Queuing:** Combines SNS-style fan-out routing and SQS-style message queuing within a single native GCP service.

---

## 📋 Tracker Metadata
| Column | Value / Status |
| :--- | :--- |
| **Category** | Stream Processing / Serverless Messaging |
| **Type** | Global Managed Message Broker & Stream |
| **Primary Use Case** | Decoupling GCP microservices, BigQuery streaming ingestion, Cloud Run webhooks |
| **Strengths** | Zero ops, global availability, instant auto-scaling, native GCP Dataflow integration |
| **Weaknesses** | Higher cost at massive continuous scale vs Kafka, 7-day retention limit, out-of-order default |
| **Best For** | Serverless GCP architectures, global event fan-out, streaming analytics pipelines |
| **Never Use When** | You need months of log retention, self-managed hardware on-prem, or raw zero-copy performance |
| **Max Scale** | Tens of millions msg/sec globally, unbounded storage retention up to 7 days |
| **Consistency Model** | At-Least-Once (default); Exactly-Once supported for pull subscriptions in region |
| **CAP Choice** | **AP** (High availability and global partition tolerance) |
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
                        GCP PUB/SUB ARCHITECTURE OVERVIEW

     PUBLISHERS                 GLOBAL TOPIC                   SUBSCRIPTIONS               SUBSCRIBERS
┌──────────────────┐       ┌──────────────────┐           ┌──────────────────┐       ┌──────────────────┐
│ Web / Mobile App │──────►│  topic-orders    │──────────►│ Sub 1 (Push)     │──────►│ Cloud Run API    │
└──────────────────┘       │                  │           │ (Webhook HTTP)   │       └──────────────────┘
                           │ (Replicated      │           └──────────────────┘
┌──────────────────┐       │  across GCP AZs) │           ┌──────────────────┐       ┌──────────────────┐
│ Microservice     │──────►│                  │──────────►│ Sub 2 (Pull)     │──────►│ Dataflow /       │
└──────────────────┘       └──────────────────┘           │ (gRPC Polling)   │       │ BigQuery Sink    │
                                                          └──────────────────┘       └──────────────────┘
```

1. **Global Topic Namespace vs. Regional Partitions:**
   Unlike Apache Kafka where topics are bound to physical partitions on specific brokers, GCP Pub/Sub topics are global logical resources. Ingestion automatically routes messages to the nearest GCP region and replicates data across multiple availability zones.
2. **Push vs. Pull Subscriptions:**
   * **Push Subscriptions:** Pub/Sub initiates an HTTPS `POST` request with the JSON/Protobuf payload to a registered public HTTP endpoint (e.g. Cloud Run). Ideal for event-driven serverless APIs.
   * **Pull Subscriptions:** Subscribers establish persistent gRPC connections and poll for messages. Ideal for high-throughput batch stream processing (e.g. Dataflow / Spark).
3. **Decoupled Retention & Acknowledgment:**
   A single Topic can have multiple independent Subscriptions. Messages are retained per subscription until explicitly Acknowledged (`ack`) or until the subscription retention limit (up to 7 days) expires.
4. **Ordering Keys & Latency Impact:**
   By default, Pub/Sub does not guarantee message ordering. When `Ordering Keys` are enabled, messages with the same key are delivered sequentially in order, but throughput for that key is capped by the processing speed of a single subscriber.

---

### 🚫 When NOT to Use (Anti-Patterns)

1. **Long-Term Event Replay (> 7 Days):**
   * *Why:* Pub/Sub unacknowledged message retention maxes out at 7 days. For historical event replay spanning months or years, stream events into **GCS Object Storage** or **Apache Kafka**.
2. **Strict Single-Digit Millisecond Processing at Ultra Scale:**
   * *Why:* Pub/Sub's global replication and HTTPS/gRPC proxy layers add 10–30ms of baseline network latency. For sub-millisecond local processing, use **Redis Streams** or self-hosted **Kafka**.
3. **Cross-Cloud Multi-Region Deployments (AWS/Azure/GCP):**
   * *Why:* Pub/Sub is native to GCP. Running AWS EC2 tasks polling GCP Pub/Sub incurs heavy egress bandwidth charges. Use **Apache Kafka** or **RabbitMQ** for multi-cloud deployments.

---

## ⚙️ Internal Architecture (The "Deep Dive")

### 1. Core Engine Mechanics (Frontend Routers & Storage Proxy)
* **Frontend Routers:** Incoming publish requests hit global Google Frontend (GFE) load balancers and route to Pub/Sub **Routers**. Routers validate authentication/IAM and forward data to assigned storage nodes.
* **Forwarders:** Manage subscriber connections, track active leases/ACK timeouts (`ackDeadline`), and push/deliver messages to workers.

### 2. Storage & Persistence Layer (Colossus & Spanner/Bigtable)
* **Colossus File System:** Message payloads are written directly to Google's distributed file system (**Colossus**) with synchronous multi-zone replication before sending a success publish ACK back to the client.
* **Metadata Indexing:** Message metadata, subscription cursor states, and ACK deadlines are tracked using Google's distributed metadata stores.

### 3. Replication & High Availability
* Data is written to the primary zone and synchronously replicated across at least two additional GCP availability zones within the region. If an entire GCP zone suffers a blackout, Pub/Sub fails over instantly without message loss.

---

## 📐 Standard Whiteboard Architecture Patterns

### 1. Serverless BigQuery Real-Time Analytics Pipeline
Publish client events into Pub/Sub, stream them into **GCP Dataflow** (Apache Beam) for sliding-window transformations, and write directly into **BigQuery Storage Write API** for real-time SQL analytics dashboarding.

```
[ App Clients ] ──► [ Pub/Sub Topic ] ──► [ Dataflow (Beam) ] ──► [ BigQuery Warehouse ]
```

### 2. Failure Modes & Dead Letter Topics (DLT)
If a subscriber fails to process a message repeatedly (e.g. database connection down), Pub/Sub increments the `deliveryAttempt` counter. Once it exceeds `maxDeliveryAttempts` (e.g. 5 attempts), Pub/Sub automatically forwards the message to a designated **Dead Letter Topic**.

```
[ Pub/Sub Subscription ] ──(Attempt 1..5 Fails)──► [ Dead Letter Topic ] ──► [ Alert Worker / DLT Sink ]
```

---

## 🛠️ Critical Configurations & Tuning

### 1. Subscription & Ack Settings
```yaml
ackDeadlineSeconds: 30                 # Time subscriber has to ACK before message is re-delivered (10s to 600s)
retainAckedMessages: false             # Set true to allow reseeking to historical offsets within retention period
messageRetentionDuration: 604800s      # 7 days max retention duration
deadLetterPolicy:
  deadLetterTopic: "projects/my-project/topics/orders-dlt"
  maxDeliveryAttempts: 5               # Forward to DLT after 5 failed processing attempts
```

### 2. Ordering Key Configuration
```java
// Enable message ordering on Publisher
Publisher publisher = Publisher.newBuilder(topicName)
    .setEnableMessageOrdering(true)
    .build();

// Publish message with explicit Ordering Key
PubsubMessage message = PubsubMessage.newBuilder()
    .setData(ByteString.copyFromUtf8("Order Update"))
    .setOrderingKey("user_account_9981") // Guarantees sequential delivery per user
    .build();
```

---

## 💰 Cost & Operational Overhead
* **DevOps Burden:** Zero (100% Serverless). No cluster provisioning, no OS patching, no capacity planning.
* **Pricing Model:** Pay per volume of data published/consumed ($40 per TB of data volume) plus data storage costs for unacknowledged messages.

## 🥊 Direct Competitors & Alternatives
* **GCP Pub/Sub vs. AWS SNS + SQS:** Pub/Sub combines SNS (Fan-out) and SQS (Queueing) into a single abstraction.
* **GCP Pub/Sub vs. Apache Kafka:** Pub/Sub = Serverless, zero-ops, global, 7-day max retention. Kafka = Partition-managed, self-hosted/MSK, custom retention, 10x cheaper at petabyte scale.

---

## 🔒 Security & Compliance
* **IAM Granular Controls:** Role-based access control (`roles/pubsub.publisher`, `roles/pubsub.subscriber`).
* **Customer-Managed Encryption Keys (CMEK):** Supports Cloud KMS encryption at rest.
* **VPC Service Controls:** Enforces network perimeter protection to prevent data exfiltration.

---

## 💼 Production Experience & Lessons Learned

### 1. Real-World Use Case
* **Platform:** *EA Overseas Multi-Tenant EdTech Platform*.
* **Implementation:** Leveraged GCP Pub/Sub push subscriptions to deliver real-time webhook events directly to serverless Cloud Run services for document verification and email notifications.

### 2. Lessons Learned (Gotchas)
* **Gotcha 1: The Short `ackDeadline` Re-delivery Storm:** Setting `ackDeadlineSeconds=10` when background PDF generation took 15 seconds caused Pub/Sub to re-deliver the same message to other workers concurrently, resulting in duplicate PDF generation and CPU exhaustion.
  * *Fix:* Increased `ackDeadlineSeconds` to 60 seconds and enabled **Automatic Ack Deadline Extension** in the client SDK.
* **Gotcha 2: Ordering Key Bottlenecks:** Enabling ordering keys without high key cardinality caused all messages to funnel through a single subscriber thread, dropping system throughput by 90%.
  * *Fix:* Ensured high key cardinality (`tenant_id + "_" + entity_id`) to maintain parallel processing across subscriber workers.
