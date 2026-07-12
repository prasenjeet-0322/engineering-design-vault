# 🏛️ Domain & Architecture Patterns

This folder contains the absolute pinnacle of high-level software engineering design. These patterns move beyond "How to write code" and into "How to architect entire businesses".

### 🏗️ 1. Domain-Driven Design (DDD) (`01-Domain-Driven-Design`)
Aligns the code structure with the real-world business domain. It identifies **Entities** (Objects with identity), **Value Objects** (Immutable attributes), and **Aggregates** (Atomic business boundaries). It is the only way to keep a massive codebase from rotting into a "Big Ball of Mud".

### ⚡ 2. CQRS (`02-CQRS`)
**Command Query Responsibility Segregation** splits the system into pure **Write** operations and pure **Read** operations. This allows you to scale and optimize your search/view logic (Queries) independently of your database transaction logic (Commands).

### 🕒 3. Event Sourcing (`03-Event-Sourcing`)
Instead of storing only the current "snapshot" of data, you store the entire **immutable history** of events that created that state. This provides a 100% accurate audit trail and allows for "Time Travel" debugging by replaying history.

### 🔄 4. Saga Orchestrator (`04-Saga-Orchestrator`)
The replacement for slow 2-Phase Commits in microservices. It coordinates a series of local transactions across multiple databases. If any step fails, the Orchestrator executes **Compensating Transactions** (Undo operations) to ensure eventual consistency.
*   *Real-world HLD: AWS Step Functions, Zeebe, Temporal.io.*
