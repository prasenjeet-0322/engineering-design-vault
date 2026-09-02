# 📬 06 - Message Queues & Event Streaming (C092-C102)

## 🧭 Messaging & Queues Study Path
Use this structured path aligned with your **Google Sheet Tracker** to master async communication patterns:

### 🟢 1. Foundations
*   [C092 - Message Queue Fundamentals](./01-Message-Queue-Fundamentals.md)
*   [C093 - Pub/Sub Pattern](./03-Pub-Sub-Pattern.md)
*   [C095 - Consumer Groups](./04-Consumer-Groups.md)

### 🟡 2. Delivery Semantics
*   [C094 - Delivery Guarantees (At-Most/At-Least/Exactly-Once)](./02-Delivery-Guarantees.md)
*   [C096 - Dead Letter Queue (DLQ)](./05-Dead-Letter-Queue.md)
*   [C097 - Backpressure](./06-Backpressure.md)

### 🔴 3. Kafka Deep Dive
*   [C098 - Kafka Architecture](./07-Kafka-Architecture.md)
*   [C099 - Kafka vs RabbitMQ](./08-Kafka-vs-RabbitMQ.md)
*   [C102 - Kafka System Design Interview Deep Dive](./11-Kafka-System-Design-Interview-Deep-Dive.md)

### 🟣 4. Event-Driven Systems
*   [C100 - Event-Driven Architecture (EDA)](./09-Event-Driven-Architecture.md)
*   [C101 - Event Streaming](./10-Event-Streaming.md)

---

## 📖 The Concept
Message brokers enable asynchronous communication between microservices, decoupling the producer of a message from the consumer. This provides buffering against traffic spikes and increases system fault tolerance.

## 📊 The SDE-2 Trade-off Table: RabbitMQ vs Kafka

| Feature | RabbitMQ (Smart Broker, Dumb Consumer) | Apache Kafka (Dumb Broker, Smart Consumer) |
| :--- | :--- | :--- |
| **Architecture** | Queue-based. Messages are pushed to consumers. | Log-based (Append-only). Consumers pull messages. |
| **Message State** | Deleted after successful consumption (ACK). | Retained on disk for a configured period (e.g., 7 days). |
| **Routing** | Complex routing topologies (Direct, Fanout, Topic). | Simple routing (Pub/Sub via Topics/Partitions). |
| **Use Case** | Task Queues (e.g., Send Email, Process Video). | Event Sourcing, Stream Processing, Massive throughput. |

## 🚫 The Interview Trap
**"I will use Kafka to handle sending password reset emails."**
Using Kafka for a simple, point-to-point task queue is architectural overkill. Kafka requires managing Zookeeper/KRaft, partitioning, and offset tracking. 
*Better Answer:* "For simple task delegation where we just need to know if the email was sent, a standard queue like RabbitMQ or AWS SQS is sufficient and much easier to operate."

## 🚀 The SDE-3 Edge: The "Dual Write" Problem (Transactional Outbox)
If the interviewer asks: *"How do you guarantee that when a user places an order in the DB, the 'OrderCreated' event is ALWAYS sent to the broker?"*

**The Trap:** 
```java
db.save(order); // Step 1
kafka.publish(event); // Step 2 (What if this crashes?)
```

**The SDE-3 Solution (Transactional Outbox):**
You cannot wrap a DB save and a Network call in a single transaction. Instead:
1. In the *same* DB transaction, save the `Order` and insert a record into an `Outbox` table.
2. A separate background process (or CDC tool like Debezium) constantly polls the `Outbox` table and publishes the messages to Kafka.
3. This guarantees **At-Least-Once** delivery. (Note: Consumers must be idempotent to handle potential duplicate messages).
