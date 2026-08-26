# ⚡ L024: Apache Pulsar

## 📖 Overview
### What is this component?
**Apache Pulsar** is an open-source, cloud-native distributed event streaming and messaging platform originally developed at Yahoo! and maintained by the Apache Software Foundation. Pulsar features a **tiered architecture that separates compute (stateless brokers) from storage (Apache BookKeeper)**, enabling seamless horizontal scaling, multi-tenancy, and native cross-datacenter geo-replication.

### Core Capabilities
* **Decoupled Compute & Storage Architecture:** Stateless Pulsar Brokers handle routing, while **Apache BookKeeper** manages segment-based ledger storage.
* **Unified Messaging Model:** Supports both streaming (Kafka-style partitions) and queuing (RabbitMQ-style competing consumers) over a single platform.
* **Native Multi-Tenancy & Namespaces:** Built-in tenant isolation with quotas, ACLs, and storage policies designed for enterprise platform hosting.
* **Out-of-the-Box Geo-Replication:** Asynchronous or synchronous replication across cloud regions without third-party plugins.

---

## 🎯 ⚡ TRIGGER POINTS: When to Use Apache Pulsar

| Trigger Scenario / Architectural Problem | Why Apache Pulsar is the EXACT Solution | Alternatives & Why They Fail |
| :--- | :--- | :--- |
| **1. Multi-Tenant Enterprise Platform** <br>*(Hosting 100+ isolated business teams on 1 shared cluster).* | Native Pulsar **Tenants & Namespaces** provide quota enforcement, storage limits, and security boundaries per team. | **Kafka:** Lacks native multi-tenancy; requires deploying separate clusters or complex topic naming conventions. |
| **2. Instant Partition Rebalancing without Data Copying** <br>*(Scaling brokers up/down during peak events).* | Pulsar brokers are **stateless**. Adding a broker node takes seconds with ZERO data rebalancing because data lives in BookKeeper. | **Kafka:** Adding a broker node requires moving gigabytes of partition log segments across the network. |
| **3. Unified Queuing + Streaming** <br>*(Need high-throughput streaming AND individual worker task queuing).* | Pulsar supports `Exclusive`, `Shared` (RabbitMQ-style competing workers), and `Failover` subscription modes natively. | **Kafka:** Lacks competing consumer task queues; **RabbitMQ:** Lacks persistent streaming log replay. |

---

## 📋 Tracker Metadata
| Column | Value / Status |
| :--- | :--- |
| **Category** | Event Streams & Messaging / Cloud-Native Stream |
| **Type** | Decoupled Distributed Event Stream & Queue |
| **Primary Use Case** | Enterprise multi-tenant streaming, unified queuing & streaming, geo-replicated messaging |
| **Strengths** | Stateless brokers, zero-rebalance scaling, BookKeeper segment storage, native multi-tenancy |
| **Weaknesses** | High operational complexity (ZooKeeper + Brokers + Bookies), smaller ecosystem than Kafka |
| **Best For** | Multi-tenant cloud platforms, geo-replicated global streams, unified messaging |
| **Never Use When** | Simple single-service queue (use RabbitMQ/SQS), small team without dedicated DevOps |
| **Max Scale** | Millions of msgs/sec, petabytes of storage via BookKeeper segment tiering |
| **Consistency Model** | Strong Consistency (BookKeeper Quorum Writes: Ensembles, Write Quorum, Ack Quorum) |
| **CAP Choice** | **CP** (Enforces BookKeeper quorum writes for durability) |
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

```
                             APACHE PULSAR ARCHITECTURE

    PRODUCERS                  STATELESS BROKERS                BOOKKEEPER STORAGE (BOOKIES)
┌──────────────┐             ┌──────────────────┐             ┌──────────────────────────┐
│ Producer 1   │────────────►│ Pulsar Broker 1  │────────────►│ Bookie 1 (Ledger Seg 1)  │
└──────────────┘             └──────────────────┘             └──────────────────────────┘
                             ┌──────────────────┐             ┌──────────────────────────┐
┌──────────────┐             │ Pulsar Broker 2  │────────────►│ Bookie 2 (Ledger Seg 2)  │
│ Producer 2   │────────────►└──────────────────┘             └──────────────────────────┘
└──────────────┘                                              ┌──────────────────────────┐
                                                              │ Bookie 3 (Ledger Seg 3)  │
                                                              └──────────────────────────┘
```

---

## 💼 Production Experience & Lessons Learned

### 1. Real-World Use Case
* **Platform:** *Global Financial Trading & Analytics Backbone*.
* **Implementation:** Deployed Apache Pulsar to support multi-tenant financial telemetry with zero-downtime broker scaling and BookKeeper storage tiering.
