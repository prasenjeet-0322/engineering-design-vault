## 📖 Overview
### What is DynamoDB?
Amazon DynamoDB is a fully managed, serverless, proprietary NoSQL database service that provides predictable, single-digit millisecond performance at any scale. It bridges the gap between a pure Key-Value store and a Wide-Column store.

### Core Capabilities
*   **Serverless Scale:** Zero servers to provision or manage. Scales automatically to handle millions of requests per second.
*   **Predictable Performance:** Guarantees single-digit millisecond latency regardless of whether your table is 1GB or 100TB.
*   **Global Tables:** Natively replicates data across multiple AWS regions for active-active global architectures.

## 📋 Tracker Metadata
| Column | Value / Status |
| :--- | :--- |
| **Category** | Database |
| **Type** | NoSQL Key-Value / Wide-Column |
| **Primary Use Case** | Serverless apps, gaming, fast lookup |
| **Strengths** | Fully managed, predictable latency |
| **Weaknesses** | Vendor lock-in, rigid access patterns |
| **Best For** | AWS-native serverless stacks |
| **Never Use When** | On-premise setups, complex analytics |
| **Max Scale** | Petabytes |
| **Consistency Model** | Eventual / Strong (Read option) |
| **CAP Choice** | AP |
| **PACELC Profile** | PA/EL (Tunable to PC/EC using `ConsistentRead=true`. See [PACELC Theorem](../../../../10-Consistency-Models/04-PACELC-Theorem.md)) |
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
1. **Single-Table Design:** To maximize performance, AWS highly recommends storing all entity types in a single table using generic PK/SK (Partition Key / Sort Key) prefixes. This makes the data model extremely rigid but insanely fast.
2. **No JOINs:** You cannot join tables. You must denormalize data or use Global Secondary Indexes (GSIs) to mimic relational queries.
3. **Throughput Throttling:** If a specific Partition Key is hit too hard (a "Hot Partition"), AWS will throttle the requests (`ProvisionedThroughputExceededException`), forcing applications to use exponential backoff.
4. **Item Size Limit:** A single item cannot exceed 400KB. It is not designed to store large blobs or documents.
5. **Secondary Index Lag:** GSIs are updated asynchronously. When you query a GSI, you are reading eventually consistent data.
6. **Fully Managed:** Completely removes the DevOps burden of managing Cassandra or MongoDB clusters.
7. **Never Use When:** You require complex ad-hoc analytics (use Snowflake), or your access patterns are entirely unknown and likely to change daily (use Postgres).

### 🚫 When NOT to Use (Anti-Patterns)
*(Do not use DynamoDB if your queries require heavy filtering on unindexed columns; `Scan` operations are prohibitively expensive and slow. Do not use for storing large payloads >400KB.)*

---

## ⚙️ Internal Architecture (The "Deep Dive")
### 1. Core Engine Mechanics
Under the hood, DynamoDB uses a B-Tree structure optimized on solid-state drives (SSDs). It shards data automatically into "Partitions" based on the hash of the Partition Key. 

### 2. Storage & Persistence Layer
When you write data, the Request Router hashes the Partition Key to find the specific storage node. Data is synchronously written to two out of three storage nodes across different Availability Zones (AZs) before returning an HTTP 200 OK.

### 3. Replication & Consensus
Every partition is backed by a Paxos-based replica group consisting of a leader and two peers across 3 AZs. The leader handles all writes and Strongly Consistent reads.

---

## 📐 Standard Whiteboard Patterns
### 1. Common Integration Architecture
**The Serverless Microservice:** API Gateway routes traffic to AWS Lambda. Lambda runs business logic and executes rapid `PutItem` or `Query` requests against DynamoDB.
**DynamoDB Streams:** Any change to the table emits an event to a Stream, triggering another Lambda to asynchronously update Elasticsearch or a Data Warehouse.

### 2. Failure Modes & Blast Radius
Highly resilient to node or AZ failures. The main failure mode is **Throttling**. If traffic spikes faster than Auto-Scaling can react, or if a single partition is overwhelmed, requests will fail. Blast radius is contained to the specific application querying the hot partition.

---

## 🛠️ Critical Configurations & Tuning
### 1. Consistency vs. Latency Flags
*   `ConsistentRead`: Can be set to `true` on `GetItem` or `Query` to bypass eventual consistency and read directly from the partition leader. Consumes double the Read Capacity Units (RCUs).

### 2. Eviction & Memory Management
*   **TTL (Time to Live):** A native feature where you specify a timestamp attribute. DynamoDB automatically deletes expired items in the background for free, perfect for session stores.

### 3. Connection & Thread Pools
*   **Provisioned vs On-Demand:** Provisioned mode requires setting exact RCU/WCU limits (cheaper, but risks throttling). On-Demand scales instantly but costs significantly more per request.

---

## 💰 Cost & Operational Overhead
Zero operational overhead (No OS patching, no backups to manage). However, costs scale directly with read/write throughput and storage. A poorly designed query (`Scan`) can cost thousands of dollars by consuming excessive RCUs.

## 🥊 Direct Competitors & Alternatives
*   **DynamoDB vs Cassandra:** Cassandra requires DevOps experts but is cloud-agnostic. DynamoDB is AWS-locked but requires zero DevOps.
*   **DynamoDB vs MongoDB:** MongoDB allows flexible querying on any field; DynamoDB strictly limits queries to the Partition and Sort keys.

## 📊 Benchmarking & True Scale Constraints
Amazon's Prime Day hits over 126 Million requests per second on DynamoDB with single-digit millisecond latency. True scale is virtually infinite if partition keys are highly randomized.

## 🔒 Security & Compliance
Integrates deeply with AWS IAM for fine-grained row-level security. Natively supports Encryption At-Rest via AWS KMS.

---

## 💼 Production Experience
### 1. Real-World Use Case
*(Example: "Built a massive serverless IoT backend. Partition Key was `sensor_id` and Sort Key was `timestamp`, allowing instant queries of recent telemetry data.")*

### 2. Lessons Learned (Gotchas)
*(Example: "Failed to randomize the Partition Key on a massive batch ingestion job, causing a 'Hot Partition' that resulted in heavy throttling and job failure.")*
