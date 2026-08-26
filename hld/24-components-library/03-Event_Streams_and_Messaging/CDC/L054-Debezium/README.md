# ⚡ L054: Debezium (Change Data Capture - CDC)

## 📖 Overview
### What is this component?
**Debezium** is an open-source, log-based **Change Data Capture (CDC)** platform built on top of **Kafka Connect**. It monitors row-level changes across relational and NoSQL databases (PostgreSQL, MySQL, MongoDB, Oracle, SQL Server) by reading their low-level transaction logs (PostgreSQL WAL, MySQL `binlog`) and streaming change events directly into Apache Kafka topics in real time.

### Core Capabilities
* **Log-Based Zero-Impact CDC:** Captures 100% of row insertions, updates, and hard deletes directly from database WAL files without executing blocking `SELECT` queries or locking table rows.
* **Dual-Write Elimination:** Solves the dual-write problem by turning database commits into the single source of truth for downstream caches (Redis), search indexes (ElasticSearch), and microservices.
* **Full Before-and-After Row Auditing:** Emits a rich event envelope containing the exact `before` state, `after` state, operation type (`c` create, `u` update, `d` delete), and transaction timestamp.
* **Zero-Code Transactional Outbox:** Enables the Transactional Outbox Pattern out-of-the-box by tailing an `outbox` table and publishing domain events cleanly to Kafka.

---

## 🎯 ⚡ TRIGGER POINTS: When to Use Debezium

| Trigger Scenario / Architectural Problem | Why Debezium is the EXACT Solution | Alternatives & Why They Fail |
| :--- | :--- | :--- |
| **1. The Dual-Write Problem** <br>*(App writes to DB and tries to update Redis/Elasticsearch in same HTTP request).* | Write **ONLY to PostgreSQL**. Debezium streams WAL changes to Kafka ➔ Kafka updates Redis/Elasticsearch asynchronously. | **Application Dual-Writes:** If Redis network drops after DB commit, cache becomes permanently stale. |
| **2. Transactional Outbox Pattern** <br>*(Microservice must publish events reliably upon DB transaction commit).* | Write business data + event row into an `outbox` table in 1 local DB ACID transaction. Debezium tails the `outbox` table and pushes to Kafka. | **In-Memory Event Bus:** App crash after DB commit loses the event forever. |
| **3. Real-Time Cache Invalidation / CDC Sync** <br>*(Invalidating Redis key when any admin updates a product price in SQL).* | Debezium captures the `UPDATE` operation in `pg_wal` and fires a cache-invalidation event into Kafka within 5ms. | **Cron Polling (`updated_at > t`):** Misses deletes, misses multiple updates, burns DB CPU with heavy table scans. |
| **4. Database-to-Data-Warehouse Sync** <br>*(Streaming OLTP DB changes into BigQuery / Snowflake / ClickHouse).* | Continuous real-time streaming of DB changes without expensive batch ETL locks. | **Nightly Batch ETL:** Data is 24 hours stale; heavy batch SQL queries degrade production OLTP performance. |
| **5. Legacy Monolith Deconstruction (Strangler Fig Pattern)** <br>*(Extracting domain events from a 10-year-old monolithic DB without rewriting legacy code).* | Deploy Debezium to tail the legacy DB `binlog`. New microservices consume clean event streams without touching legacy monolith code. | **Refactoring Legacy Monolith Code:** High risk, expensive, takes years of developer effort. |

---

## 📋 Tracker Metadata
| Column | Value / Status |
| :--- | :--- |
| **Category** | Event Streams & Messaging / CDC |
| **Type** | Log-Based Change Data Capture (Kafka Connect Source) |
| **Primary Use Case** | DB-to-Cache Sync, Transactional Outbox, Search Index Sync, DB Replication |
| **Strengths** | Log-based zero-lock CDC, captures deletes & updates, 100% data capture reliability |
| **Weaknesses** | Operational dependency on Kafka Connect, risk of WAL disk growth if connector stalls |
| **Best For** | Outbox Pattern, Real-time Search Sync (Postgres to ES), Multi-service event streaming |
| **Never Use When** | Simple REST API integrations, low-volume app where simple polling triggers are sufficient |
| **Max Scale** | 50,000+ CDC change events/sec per connector task |
| **Consistency Model** | Eventual Consistency for downstream consumers; Strict ordering per primary key |
| **CAP Choice** | **AP** (Asynchronous non-blocking log tailing) |
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
                        DEBEZIUM LOG-BASED CDC ARCHITECTURE

   [ App Client ] ──1. ACID Txn──► [ PostgreSQL DB ]
                                          │
                                          ▼ (Appends to WAL File on Disk)
                                  [ Write-Ahead Log (WAL) ]
                                          │
                                          ▼ 2. Reads WAL Stream via Replication Slot
                                   [ Debezium Connector ] (Kafka Connect)
                                          │
                                          ▼ 3. Emits JSON/Avro CDC Payload
                                   [ Apache Kafka Topic ]
                                          │
                        ┌─────────────────┴─────────────────┐
                        ▼                                   ▼
             [ Redis Cache Consumer ]           [ Elasticsearch Consumer ]
             (Invalidate Key)                   (Index Updated Document)
```

---

### 📡 Debezium as the Distributed Observer Pattern

Debezium is the **database-level implementation of the [Observer Design Pattern](../../../../lld/03-Behavioral/02-Observer%20Design%20Pattern/README.md)** scaled out to distributed systems:

```
+-----------------------------------------------------------------------------------+
|                           THE OBSERVER PATTERN MAPPING                            |
+-----------------------------------------------------------------------------------+
|  1. Subject (Publisher):  Database Write-Ahead Log (pg_wal / binlog)              |
|                           State changes (INSERT/UPDATE/DELETE) append to WAL.     |
|                                                                                   |
|  2. Primary Observer:     Debezium CDC Connector                                  |
|                           Observes WAL changes via replication slot non-stop.     |
|                                                                                   |
|  3. Event Bus Router:     Apache Kafka Topics                                     |
|                           Debezium publishes CDC payload to Kafka topics.          |
|                                                                                   |
|  4. Downstream Observers: Redis Cache, Elasticsearch, BigQuery, Microservices       |
|                           React independently to state changes without touching DB.|
+-----------------------------------------------------------------------------------+
```

* **Why it matters:** In traditional OOP, the `Subject` holds an in-memory `List<Observer>`. In database CDC, PostgreSQL doesn't know who is listening—**Debezium acts as the non-intrusive Observer** that tails the binary log on disk, broadcasting state changes to external subscribers without adding a single millisecond of overhead to database transactions!

---


1. **Log-Based CDC vs. Query-Based Polling:**
   * **Query Polling (`SELECT * FROM table WHERE updated_at > last_poll`):** Burns DB CPU, misses intermediate row updates, misses hard `DELETE` operations, and fails if `updated_at` isn't indexed properly.
   * **Log-Based CDC (Debezium):** Reads low-level binary transaction logs on disk. Captures **100% of inserts, updates, and deletes** with zero row locks and near-zero CPU overhead on the primary DB engine.
2. **The "At-Least-Once" Delivery Contract:**
   Debezium guarantees that no database commit will be missed. If the Debezium connector process restarts, it resumes reading from the last committed WAL position (LSN / offset). Downstream consumers must handle **idempotency** using primary keys or `eventId`.
3. **Initial Snapshotting without Table Locks:**
   When Debezium starts on an existing database table with 10,000,000 rows, it takes an initial snapshot using a `REPEATABLE READ` transaction mode to stream existing rows while concurrently queuing incoming live WAL changes.

---

## ⚙️ Internal Architecture (The "Deep Dive")

### 1. Database-Specific Log Tailing Mechanics
* **PostgreSQL (`pgoutput` / `decoderbufs` Plugin):** Debezium connects via PostgreSQL's logical replication interface (`pg_replication_slots`). PostgreSQL decodes WAL records into logical change events before transmitting them to Debezium.
* **MySQL (`binlog_format = ROW`):** Debezium acts as a pseudo-MySQL replica node. It connects to the MySQL server and receives raw row-based binary log events (`binlog`).
* **MongoDB (Change Streams):** Debezium tail-reads MongoDB's replica set `oplog` (Operations Log) or leverages MongoDB Change Streams API.

### 2. The Granular Debezium Event Envelope (Schema Structure)
Every CDC event emitted to Kafka contains a structured payload revealing exact database state:

```json
{
  "schema": { ... },
  "payload": {
    "before": {
      "id": 1042,
      "user_id": "usr_9981",
      "status": "PENDING",
      "amount": 150.00
    },
    "after": {
      "id": 1042,
      "user_id": "usr_9981",
      "status": "PAID",
      "amount": 150.00
    },
    "source": {
      "version": "2.4.0.Final",
      "connector": "postgresql",
      "name": "production_db",
      "ts_ms": 1722873600000,
      "db": "payment_db",
      "table": "orders",
      "lsn": 248596048
    },
    "op": "u", 
    "ts_ms": 1722873600005
  }
}
```

* **Operation Types (`op` field):**
  * `"c"` = Create (Insert) ➔ `before` is `null`, `after` contains new row data.
  * `"u"` = Update ➔ `before` contains old row values, `after` contains updated row values.
  * `"d"` = Delete ➔ `before` contains last row values, `after` is `null`.
  * `"r"` = Read ➔ Snapshot read of existing rows on startup.

---

## 📐 Standard Whiteboard Patterns

### 1. The Transactional Outbox Pattern Architecture
To guarantee that a microservice publishes a domain event into Kafka without risking data inconsistency:

```sql
-- Step 1: Execute in PostgreSQL in 1 ACID Transaction
BEGIN;
INSERT INTO orders (id, status, amount) VALUES ('ord_101', 'PAID', 99.00);
INSERT INTO outbox (id, aggregate_type, aggregate_id, payload) 
VALUES ('evt_505', 'Order', 'ord_101', '{"event":"ORDER_PAID","amount":99.00}');
COMMIT;
```

Debezium tails the `outbox` table in `pg_wal`, routes `ORDER_PAID` to Kafka topic `orders.events`, and automatically filters out internal outbox metadata using Debezium's **Event Router SMT (Single Message Transform)**.

```
[ Microservice API ] ──1. DB Txn (Order + Outbox)──► [ Postgres DB ]
                                                           │
                                                           ▼ (WAL Log)
                                                    [ Debezium CDC ]
                                                           │
                                                           ▼ (SMT Outbox Router)
                                                    [ Kafka Topic: orders.events ]
```

---

## 🛠️ Critical Configurations & Production Tuning

### 1. PostgreSQL Connector Configuration (`debezium-postgres-connector.json`)
```json
{
  "name": "postgres-order-connector",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "tasks.max": "1",
    "plugin.name": "pgoutput",
    "database.hostname": "postgres-primary.internal",
    "database.port": "5432",
    "database.user": "debezium_cdc",
    "database.password": "${file:/secrets/db:password}",
    "database.dbname": "shop_db",
    "database.server.name": "prod_postgres",
    "table.include.list": "public.orders,public.outbox",
    
    "snapshot.mode": "initial",
    "tombstones.on.delete": "true",
    "decimal.handling.mode": "double",
    
    "transforms": "outbox",
    "transforms.outbox.type": "io.debezium.transforms.outbox.EventRouter",
    "transforms.outbox.table.fields.additional.placement": "type:header"
  }
}
```

---

## 💥 Failure Modes, Edge Cases & Disaster Recovery

### ⚠️ 1. The WAL Disk Full Crisis (The #1 PostgreSQL Production Disaster!)
* **The Problem:** If the Debezium connector or Kafka cluster goes down for 12 hours, PostgreSQL's replication slot (`pg_replication_slots`) **prevents PostgreSQL from deleting old WAL log files**. The `pg_wal` directory grows rapidly until disk space reaches 100%, causing the primary PostgreSQL database to crash!
* **Mitigation Strategy:**
  1. Set `max_slot_wal_keep_size` in `postgresql.conf` (e.g., `10 GB`). If Debezium lags beyond 10 GB, Postgres drops the replication slot to save the database, forcing a Debezium re-snapshot upon recovery.
  2. Implement Prometheus alerts on `pg_replication_slots.wal_status` and disk utilization.

### ⚠️ 2. Schema Evolution & DDL Drift
* **The Problem:** A database migration runs `ALTER TABLE orders ADD COLUMN vat_amount DECIMAL`.
* **Mitigation:** Integrate Debezium with **Confluent Schema Registry** (`AvroConverter`). Debezium automatically registers the new Avro schema version in Schema Registry, allowing downstream Kafka consumers to handle backward compatibility gracefully.

---

## 🥊 Direct Competitors & Alternatives
* **Debezium vs. AWS Database Migration Service (DMS):** Debezium = Open-source, superior Outbox SMT support, precise event envelopes. AWS DMS = Managed cloud service, but has higher latency and weaker Schema Registry integration.
* **Debezium vs. Dynamic Application Triggers (SQL Triggers):** SQL Triggers execute synchronous PL/pgSQL logic inside DB transaction threads, slowing down DB writes. Debezium reads disk logs asynchronously with **zero impact on write latency**.

---

## 💼 Production Experience & Lessons Learned

### 1. Real-World Use Case
* **Platform:** *E-Commerce & Financial Payment Outbox Engine*.
* **Implementation:** Deployed Debezium on Kafka Connect to tail PostgreSQL WAL files, invalidating Redis user session caches instantly upon DB writes and reliably driving the Transactional Outbox Pattern for payment notifications.

### 2. Lessons Learned (Gotchas)
* **Gotcha 1: Precision Loss on `DECIMAL` Columns:** Debezium's default setting for `DECIMAL` / `NUMERIC` SQL columns encodes values as bytes or strings, breaking downstream JS/Python JSON consumers.
  * *Fix:* Set `"decimal.handling.mode": "double"` or `"string"` in the connector JSON configuration.
* **Gotcha 2: The Replica Slot Orphan Leak:** Deleting a Debezium connector via Kafka Connect API does NOT automatically delete the replication slot inside PostgreSQL. The orphaned slot holds WAL logs continuously until disk fills up.
  * *Fix:* Always run `SELECT pg_drop_replication_slot('debezium_slot_name');` inside PostgreSQL after decommissioning a Debezium connector.
