# ⏳ Module 02: Queuing, Scheduling & Async Execution

[🏠 Back to Master Guide](./README.md) &nbsp; | &nbsp; [Previous: ⚡ Anatomy & Undo/Redo](./01-ANATOMY_AND_UNDO_REDO_MECHANICS.md) &nbsp; | &nbsp; [Next: 🏛️ CQRS, Sagas & Rollbacks](./03-CQRS_SAGAS_AND_TRANSACTIONAL_ROLLBACKS.md)

---

## 🎯 Executive Overview

One of the most powerful architectural characteristics of the **Command Pattern** is that it turns a method call into an **object in memory**, decoupling **request creation** from **request execution in time**.

This enables:
1. **Asynchronous Background Task Queuing** (e.g. RabbitMQ / Redis task workers).
2. **Scheduled & Delayed Execution** (e.g. Quartz Scheduler / Cron jobs).
3. **Priority-Based Job Processing** (`PriorityBlockingQueue`).
4. **Resilience & Retry Policies** with exponential backoff.

---

## 🔄 1. Decoupling Execution in Time

In standard object-oriented programming, calling a method executes immediately on the caller's thread:

```
Direct Call:   [ Client ] ──(synchronous call)──► [ Service.doWork() ] (Blocks caller)
```

With the Command Pattern, requests are encapsulated as data objects and placed into a queue:

```
Command Queue: [ Client ] ──► [ Push Command to Queue ] ──► [ Worker Pool ] ──► [ cmd.execute() ]
                                      ▲                              ▲
                                      └─ Memory Buffer / Redis       └─ Executes asynchronously
```

---

## 🧵 2. Thread Pools & the `Runnable` Interface

In the Java Standard Library, **`java.lang.Runnable`** and **`java.util.concurrent.Callable<V>`** are the most famous real-world implementations of the Command Pattern:

```java
// Runnable is literally a Command interface!
@FunctionalInterface
public interface Runnable {
    void run(); // equivalent to execute()
}
```

### Thread Pool Worker Queue Implementation:

```java
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

public class JobQueueInvoker {
    private final BlockingQueue<Command> jobQueue = new LinkedBlockingQueue<>(1000);
    private volatile boolean running = true;

    public JobQueueInvoker(int workerCount) {
        for (int i = 0; i < workerCount; i++) {
            new Thread(this::workerLoop, "Worker-" + i).start();
        }
    }

    public void submit(Command cmd) throws InterruptedException {
        jobQueue.put(cmd); // Non-blocking buffer
    }

    private void workerLoop() {
        while (running) {
            try {
                Command cmd = jobQueue.take(); // Blocks until a command is available
                cmd.execute();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                System.err.println("❌ Job execution failed: " + e.getMessage());
            }
        }
    }
}
```

---

## 💾 3. Command Serialization for Distributed Workers (Celery / SQS)

When scaling to distributed worker pools (e.g. Celery in Python or BullMQ in Node.js):
1. The Command is serialized to **JSON / Protobuf**.
2. The JSON payload is published to a distributed message queue (RabbitMQ / AWS SQS).
3. A remote worker node deserializes the JSON into a Command instance and calls `.execute()`.

```json
{
  "commandType": "GeneratePdfReportCommand",
  "commandId": "cmd-88392",
  "timestamp": 1724350000,
  "payload": {
    "reportId": "REP-9921",
    "userId": "usr-104",
    "format": "PDF"
  }
}
```

---

## 🔑 Key Takeaways for Interviews

1. Cite **`Runnable` / `Callable`** as Java's built-in implementation of the Command pattern.
2. Explain how encapsulating requests as objects allows **temporal decoupling** (queuing, scheduling, and asynchronous worker execution).
3. Connect Command serialization to **distributed task queues (RabbitMQ, SQS, Celery)**.
